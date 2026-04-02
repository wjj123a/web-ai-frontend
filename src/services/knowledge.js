const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TRACEBACK_MARKERS = [
  "Traceback (most recent call last):",
  "openai.APIConnectionError",
  "httpx.ConnectError",
  "httpcore.ConnectError",
  "Connection error",
  "File \"",
];

function buildHeaders(token) {
  return {
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

function getFallbackMessage(response) {
  if (response.url.includes("/analyze/temporary-documents")) {
    return "文档分析服务暂时不可用，请稍后重试";
  }

  return "知识库服务暂时不可用，请稍后重试";
}

async function parseErrorResponse(response) {
  const text = await response.text().catch(() => "");
  const data = text ? parseJsonSafely(text) : null;
  const detailMessage = typeof data?.detail === "string" ? data.detail.trim() : "";
  const fallbackMessage = getFallbackMessage(response);

  if (response.status === 401) {
    return "登录状态已失效，请重新登录";
  }

  if (response.status === 403) {
    return "你没有权限访问该知识库资源";
  }

  if (response.status === 404) {
    return "目标文档不存在";
  }

  if (detailMessage) {
    if (response.status >= 500 || looksLikeServerTraceback(detailMessage)) {
      return fallbackMessage;
    }

    return detailMessage;
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    return fallbackMessage;
  }

  if (response.status >= 500 || looksLikeServerTraceback(normalizedText)) {
    return fallbackMessage;
  }

  return normalizedText;
}

function normalizeKnowledgeDocument(item) {
  return {
    id: Number(item.id),
    name: item.name,
    size: Number(item.file_size || 0),
    typeLabel: String(item.file_type || "").toUpperCase() || "文件",
    uploadedAt: item.updated_at || item.created_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function normalizeTemporaryAnalysis(item) {
  return {
    fileName: item.file_name,
    fileType: item.file_type,
    instruction: item.instruction,
    result: item.result || "",
  };
}

export async function listKnowledgeDocuments({ token }) {
  const response = await fetch(`${API_BASE_URL}/knowledge/documents`, {
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeKnowledgeDocument) : [];
}

export async function uploadKnowledgeDocument({ file, token }) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/knowledge/documents`, {
    method: "POST",
    headers: buildHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = await response.json();
  return normalizeKnowledgeDocument(data);
}

export async function analyzeTemporaryDocument({ file, instruction, token }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("instruction", instruction);

  const response = await fetch(`${API_BASE_URL}/analyze/temporary-documents`, {
    method: "POST",
    headers: buildHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = await response.json();
  return normalizeTemporaryAnalysis(data);
}

export async function deleteKnowledgeDocument({ documentId, token }) {
  const response = await fetch(`${API_BASE_URL}/knowledge/documents/${documentId}`, {
    method: "DELETE",
    headers: buildHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }
}
