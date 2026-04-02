const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TRACEBACK_MARKERS = [
  "Traceback (most recent call last):",
  "openai.APIConnectionError",
  "httpx.ConnectError",
  "httpcore.ConnectError",
  "Connection error",
  "File \"",
];

function buildHeaders(token, includeJson = true) {
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function parseJsonSafely(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function looksLikeServerTraceback(value) {
  if (typeof value !== "string") {
    return false;
  }

  const normalizedText = value.trim();

  if (!normalizedText) {
    return false;
  }

  return TRACEBACK_MARKERS.some((marker) => normalizedText.includes(marker));
}

async function parseErrorResponse(response) {
  const text = await response.text().catch(() => "");
  const data = text ? parseJsonSafely(text) : null;
  const detailMessage = typeof data?.detail === "string" ? data.detail.trim() : "";

  if (response.status === 401) {
    return "登录状态已失效，请重新登录";
  }

  if (response.status === 403) {
    return "你没有权限访问该会话";
  }

  if (response.status === 404) {
    return "目标会话不存在";
  }

  if (detailMessage) {
    if (response.status >= 500 || looksLikeServerTraceback(detailMessage)) {
      return "智能对话服务暂时不可用，请稍后重试";
    }

    return detailMessage;
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    return "智能对话服务暂时不可用，请稍后重试";
  }

  if (response.status >= 500 || looksLikeServerTraceback(normalizedText)) {
    return "智能对话服务暂时不可用，请稍后重试";
  }

  return normalizedText;
}

async function request(path, { method = "GET", token = "", body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, body !== undefined),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function normalizeConversation(item) {
  return {
    id: Number(item.id),
    title: item.title || "新对话",
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    messages: [],
    messagesLoaded: false,
  };
}

function normalizeMessage(item) {
  return {
    id: `server-${item.id}`,
    serverId: Number(item.id),
    role: item.role,
    content: item.content || "",
    createdAt: item.created_at,
    sections: [],
  };
}

function getFirstString(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function extractTextEvent(payload) {
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
  const delta = choice?.delta ?? choice?.message ?? {};

  return getFirstString([
    payload?.delta,
    payload?.text,
    payload?.content,
    payload?.message,
    payload?.answer,
    payload?.output,
    payload?.token,
    payload?.data?.text,
    payload?.data?.content,
    delta?.content,
    delta?.text,
    choice?.text,
  ]);
}

function extractReasoningEvent(payload) {
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
  const delta = choice?.delta ?? {};

  return getFirstString([
    payload?.reasoning,
    payload?.reasoning_content,
    payload?.thinking,
    payload?.thought,
    delta?.reasoning_content,
    payload?.data?.reasoning,
    payload?.data?.reasoning_content,
  ]);
}

function buildSectionEvent(sectionKey, label, text) {
  if (!text) {
    return null;
  }

  return {
    kind: "section",
    sectionKey,
    label,
    text,
  };
}

function normalizeStructuredPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => normalizeStructuredPayload(item));
  }

  if (typeof payload === "string") {
    return payload ? [{ kind: "text", text: payload }] : [];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const eventType = getFirstString([
    payload.type,
    payload.event,
    payload.kind,
    payload.stage,
  ]).toLowerCase();

  if (
    payload.done === true ||
    payload.completed === true ||
    ["done", "finish", "completed", "complete", "end"].includes(eventType)
  ) {
    return [{ kind: "done" }];
  }

  const events = [];
  const reasoningText = extractReasoningEvent(payload);

  if (reasoningText) {
    events.push(buildSectionEvent("reasoning", "思考过程", reasoningText));
  }

  const sectionMappings = [
    { key: "tool", label: "工具调用", match: ["tool", "function"] },
    { key: "knowledge", label: "知识库命中", match: ["knowledge", "retriev", "citation", "reference"] },
    { key: "status", label: "执行状态", match: ["status", "phase", "step", "progress"] },
  ];

  const textEvent = extractTextEvent(payload);

  for (const mapping of sectionMappings) {
    if (mapping.match.some((keyword) => eventType.includes(keyword))) {
      const sectionText = textEvent || getFirstString([payload.label, payload.title, payload.status]);
      const sectionEvent = buildSectionEvent(mapping.key, mapping.label, sectionText);

      if (sectionEvent) {
        events.push(sectionEvent);
      }

      return events;
    }
  }

  if (payload.data && typeof payload.data === "object") {
    const nestedEvents = normalizeStructuredPayload(payload.data);

    if (nestedEvents.length) {
      return [...events, ...nestedEvents];
    }
  }

  if (textEvent) {
    events.push({
      kind: "text",
      text: textEvent,
    });
  }

  const choice = Array.isArray(payload.choices) ? payload.choices[0] : null;
  if (choice?.finish_reason) {
    events.push({ kind: "done" });
  }

  return events.filter(Boolean);
}

function parseStructuredLine(line) {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return { events: [] };
  }

  if (trimmedLine.startsWith("event:")) {
    return { events: [] };
  }

  const dataLine = trimmedLine.startsWith("data:") ? trimmedLine.slice(5).trim() : trimmedLine;

  if (!dataLine) {
    return { events: [] };
  }

  if (dataLine === "[DONE]") {
    return { events: [{ kind: "done" }], isStructured: true };
  }

  const parsedPayload = parseJsonSafely(dataLine);

  if (parsedPayload !== null) {
    return {
      events: normalizeStructuredPayload(parsedPayload),
      isStructured: true,
    };
  }

  if (trimmedLine.startsWith("data:")) {
    return {
      events: [{ kind: "text", text: dataLine }],
      isStructured: true,
    };
  }

  if (trimmedLine.startsWith("{") || trimmedLine.startsWith("[")) {
    return {
      events: [],
      parseFailed: true,
    };
  }

  return {
    events: [{ kind: "text", text: dataLine }],
    isStructured: false,
  };
}

function consumeStructuredBuffer(buffer, isDone) {
  const normalizedBuffer = buffer.replace(/\r\n/g, "\n");
  const lines = normalizedBuffer.split("\n");
  const events = [];
  let hasStructuredEvent = false;
  let parseFailed = false;

  let remaining = "";
  if (!isDone) {
    remaining = lines.pop() ?? "";
  }

  for (const line of lines) {
    const result = parseStructuredLine(line);

    if (result.parseFailed) {
      parseFailed = true;
      break;
    }

    if (result.isStructured) {
      hasStructuredEvent = true;
    }

    events.push(...result.events);
  }

  if (isDone && remaining.trim()) {
    const result = parseStructuredLine(remaining);

    if (result.parseFailed) {
      parseFailed = true;
    } else {
      if (result.isStructured) {
        hasStructuredEvent = true;
      }

      events.push(...result.events);
      remaining = "";
    }
  }

  return {
    events,
    remaining,
    parseFailed,
    hasStructuredEvent,
  };
}

export async function listConversations({ token }) {
  const data = await request("/chat/conversations", { token });
  return Array.isArray(data) ? data.map(normalizeConversation) : [];
}

export async function createConversation({ title, token }) {
  const data = await request("/chat/conversations", {
    method: "POST",
    token,
    body: { title },
  });

  return normalizeConversation(data);
}

export async function getConversationMessages({ conversationId, token }) {
  const data = await request(`/chat/conversations/${conversationId}/messages`, { token });
  return Array.isArray(data) ? data.map(normalizeMessage) : [];
}

export async function deleteConversation({ conversationId, token }) {
  await request(`/chat/conversations/${conversationId}`, {
    method: "DELETE",
    token,
  });
}

export async function streamConversationReply({
  conversationId,
  message,
  token = "",
  signal,
  onText,
  onStructuredEvent,
}) {
  const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/stream`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  if (!response.body) {
    throw new Error("流式响应不可用，请检查后端输出");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let streamMode = "unknown";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    const chunkText = value ? decoder.decode(value, { stream: !done }) : "";

    if (streamMode === "plain") {
      if (chunkText) {
        fullText += chunkText;
        onText?.(fullText, chunkText);
      }

      if (done) {
        break;
      }

      continue;
    }

    buffer += chunkText;

    if (streamMode === "unknown") {
      const trimmedBuffer = buffer.trimStart();

      if (!trimmedBuffer) {
        if (done) {
          break;
        }

        continue;
      }

      if (/^(data:|\{|\[)/.test(trimmedBuffer)) {
        streamMode = "structured";
      } else {
        streamMode = "plain";
        fullText += buffer;
        onText?.(fullText, buffer);
        buffer = "";

        if (done) {
          break;
        }

        continue;
      }
    }

    const { events, remaining, parseFailed, hasStructuredEvent } = consumeStructuredBuffer(buffer, done);

    if (parseFailed && !hasStructuredEvent) {
      streamMode = "plain";
      fullText += buffer;
      onText?.(fullText, buffer);
      buffer = "";

      if (done) {
        break;
      }

      continue;
    }

    buffer = remaining;

    for (const event of events) {
      if (event.kind === "text") {
        fullText += event.text;
        onText?.(fullText, event.text);
        continue;
      }

      if (event.kind === "section") {
        onStructuredEvent?.(event);
      }
    }

    if (done) {
      if (buffer.trim()) {
        fullText += buffer;
        onText?.(fullText, buffer);
      }
      break;
    }
  }

  return fullText;
}
