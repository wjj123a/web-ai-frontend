<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import ChatConversationPanel from "../components/chat/ChatConversationPanel.vue";
import ChatHistoryPanel from "../components/chat/ChatHistoryPanel.vue";
import KnowledgePanel from "../components/chat/KnowledgePanel.vue";
import {
  createConversation,
  getConversationMessages,
  listConversations,
  streamConversationReply,
} from "../services/chat";
import {
  buildConversationTitle,
  loadKnowledgeDocuments,
  saveKnowledgeDocuments,
} from "../services/chatStorage";
import { clearSession, useSession } from "../services/session";

const router = useRouter();
const session = useSession();

const conversations = ref([]);
const documents = ref(loadKnowledgeDocuments());
const activeConversationId = ref(null);
const draftMessage = ref("");
const errorMessage = ref("");
const isStreaming = ref(false);
const isLoadingConversations = ref(false);
const isLoadingConversation = ref(false);

let streamController = null;

const isLoggedIn = computed(() => {
  return Boolean(session.accessToken && session.username && session.expiresAt);
});

const activeConversation = computed(() => {
  return conversations.value.find((item) => item.id === activeConversationId.value) ?? null;
});

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureAuthenticated() {
  if (isLoggedIn.value) {
    return true;
  }

  router.replace("/auth?mode=login");
  return false;
}

function sortConversations(items) {
  return [...items].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function updateConversation(nextConversation) {
  const nextConversations = conversations.value.filter((item) => item.id !== nextConversation.id);
  conversations.value = sortConversations([nextConversation, ...nextConversations]);
}

function getConversationById(conversationId) {
  return conversations.value.find((item) => item.id === conversationId) ?? null;
}

function updateConversationMessage(conversationId, messageId, updater) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return;
  }

  updateConversation({
    ...conversation,
    messages: conversation.messages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      return updater(message);
    }),
    preview: conversation.preview,
  });
}

function setConversationMessages(conversationId, messages) {
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    return;
  }

  const lastMessage = messages[messages.length - 1];
  updateConversation({
    ...conversation,
    messages,
    messagesLoaded: true,
    preview: lastMessage?.content || "",
  });
}

function mergeServerConversations(nextConversations) {
  const existingMap = new Map(conversations.value.map((item) => [item.id, item]));

  conversations.value = sortConversations(
    nextConversations.map((conversation) => {
      const existing = existingMap.get(conversation.id);
      return {
        ...conversation,
        messages: existing?.messages ?? [],
        messagesLoaded: existing?.messagesLoaded ?? false,
        preview: existing?.preview ?? "",
      };
    }),
  );
}

async function loadConversations({ selectFirst = true } = {}) {
  isLoadingConversations.value = true;

  try {
    const list = await listConversations({
      token: session.accessToken,
    });
    mergeServerConversations(list);

    if (activeConversationId.value && conversations.value.some((item) => item.id === activeConversationId.value)) {
      return;
    }

    activeConversationId.value = selectFirst ? conversations.value[0]?.id ?? null : null;
  } finally {
    isLoadingConversations.value = false;
  }
}

async function loadMessagesForConversation(conversationId) {
  if (!conversationId) {
    return;
  }

  const targetConversation = getConversationById(conversationId);
  if (!targetConversation) {
    return;
  }

  isLoadingConversation.value = true;

  try {
    const messages = await getConversationMessages({
      conversationId,
      token: session.accessToken,
    });
    setConversationMessages(conversationId, messages);
  } finally {
    isLoadingConversation.value = false;
  }
}

function persistDocuments(nextDocuments) {
  documents.value = nextDocuments;
  saveKnowledgeDocuments(documents.value);
}

function getFileTypeLabel(file) {
  const extension = file.name.split(".").pop()?.toUpperCase();
  return extension || "文件";
}

function handleUploadFiles(files) {
  const nextDocuments = files.map((file) => {
    return {
      id: createClientId(),
      name: file.name,
      size: file.size,
      typeLabel: getFileTypeLabel(file),
      uploadedAt: new Date().toISOString(),
    };
  });

  persistDocuments([...nextDocuments, ...documents.value]);
}

function handleRemoveDocument(documentId) {
  persistDocuments(documents.value.filter((item) => item.id !== documentId));
}

function stopStreaming() {
  if (streamController) {
    streamController.abort();
    streamController = null;
  }

  isStreaming.value = false;
}

function appendAssistantText(conversationId, messageId, nextText) {
  updateConversationMessage(conversationId, messageId, (message) => {
    return {
      ...message,
      content: nextText,
    };
  });
}

function appendAssistantSection(conversationId, messageId, event) {
  updateConversationMessage(conversationId, messageId, (message) => {
    const currentSections = Array.isArray(message.sections) ? [...message.sections] : [];
    const sectionIndex = currentSections.findIndex((item) => item.key === event.sectionKey);

    if (sectionIndex >= 0) {
      currentSections[sectionIndex] = {
        ...currentSections[sectionIndex],
        content: `${currentSections[sectionIndex].content}${event.text}`,
      };
    } else {
      currentSections.push({
        key: event.sectionKey,
        label: event.label,
        content: event.text,
      });
    }

    return {
      ...message,
      sections: currentSections,
    };
  });
}

async function ensureConversationForMessage(message) {
  const currentConversation = activeConversation.value;

  if (currentConversation) {
    return currentConversation;
  }

  const createdConversation = await createConversation({
    title: buildConversationTitle(message),
    token: session.accessToken,
  });

  const nextConversation = {
    ...createdConversation,
    messages: [],
    messagesLoaded: true,
    preview: "",
  };

  updateConversation(nextConversation);
  activeConversationId.value = nextConversation.id;
  return nextConversation;
}

function handleLogout() {
  stopStreaming();
  clearSession();
  router.push("/auth?mode=login");
}

function resolveErrorMessage(error, fallbackMessage) {
  const message = error?.message || fallbackMessage;

  if (message.includes("登录状态已失效")) {
    handleLogout();
  }

  return message;
}

async function handleSelectConversation(conversationId) {
  const targetConversation = getConversationById(conversationId);

  if (isStreaming.value) {
    return;
  }

  if (activeConversationId.value === conversationId && targetConversation?.messagesLoaded) {
    return;
  }

  activeConversationId.value = conversationId;
  errorMessage.value = "";

  try {
    await loadMessagesForConversation(conversationId);
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, "加载历史消息失败，请稍后重试");
  }
}

function handleCreateConversation() {
  if (isStreaming.value) {
    return;
  }

  activeConversationId.value = null;
  draftMessage.value = "";
  errorMessage.value = "";
}

async function handleSubmit() {
  if (!ensureAuthenticated()) {
    return;
  }

  const message = draftMessage.value.trim();

  if (!message || isStreaming.value) {
    return;
  }

  errorMessage.value = "";
  draftMessage.value = "";

  let conversation = null;

  try {
    conversation = await ensureConversationForMessage(message);
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, "创建会话失败，请稍后重试");
    return;
  }

  const now = new Date().toISOString();
  const userMessage = {
    id: createClientId(),
    role: "user",
    content: message,
    createdAt: now,
    sections: [],
  };
  const assistantMessage = {
    id: createClientId(),
    role: "assistant",
    content: "",
    createdAt: now,
    sections: [],
  };

  updateConversation({
    ...conversation,
    updatedAt: now,
    messagesLoaded: true,
    preview: message,
    messages: [...conversation.messages, userMessage, assistantMessage],
  });

  isStreaming.value = true;
  streamController = new AbortController();

  try {
    const fullText = await streamConversationReply({
      conversationId: conversation.id,
      message,
      token: session.accessToken,
      signal: streamController.signal,
      onText(nextFullText) {
        appendAssistantText(conversation.id, assistantMessage.id, nextFullText);
      },
      onStructuredEvent(event) {
        appendAssistantSection(conversation.id, assistantMessage.id, event);
      },
    });

    if (!fullText.trim()) {
      appendAssistantText(
        conversation.id,
        assistantMessage.id,
        "已收到请求，但模型这次没有返回可展示的内容。",
      );
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      const currentConversation = getConversationById(conversation.id);
      const currentAssistant = currentConversation?.messages.find((item) => item.id === assistantMessage.id);

      if (!currentAssistant?.content.trim()) {
        appendAssistantText(conversation.id, assistantMessage.id, "已停止生成本次回复。");
      }
    } else {
      errorMessage.value = resolveErrorMessage(error, "智能对话暂时不可用，请稍后重试");
      appendAssistantText(conversation.id, assistantMessage.id, errorMessage.value);
    }
  } finally {
    isStreaming.value = false;
    streamController = null;
  }
}

onMounted(async () => {
  if (!ensureAuthenticated()) {
    return;
  }

  try {
    await loadConversations();

    if (activeConversationId.value) {
      await loadMessagesForConversation(activeConversationId.value);
    }
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, "加载历史会话失败，请稍后重试");
  }
});

onBeforeUnmount(() => {
  stopStreaming();
});
</script>

<template>
  <div class="workspace-page chat-workspace-page">
    <div class="workspace-shell">
      <header class="workspace-topbar">
        <RouterLink class="workspace-logo" to="/">w.ai</RouterLink>

        <div class="workspace-topbar-actions">
          <div class="workspace-user">
            <span class="workspace-user-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10.5C12.0711 10.5 13.75 8.82107 13.75 6.75C13.75 4.67893 12.0711 3 10 3C7.92893 3 6.25 4.67893 6.25 6.75C6.25 8.82107 7.92893 10.5 10 10.5Z" stroke="currentColor" stroke-width="1.8" />
                <path d="M3.75 16.25C4.85669 13.9858 7.16958 12.5 10 12.5C12.8304 12.5 15.1433 13.9858 16.25 16.25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <span>{{ session.username }}</span>
          </div>

          <button class="workspace-logout" type="button" @click="handleLogout">
            <span class="workspace-logout-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5.25H6.25C5.55964 5.25 5 5.80964 5 6.5V13.5C5 14.1904 5.55964 14.75 6.25 14.75H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M11 13.5L14.5 10L11 6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M14.25 10H8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <span>退出</span>
          </button>
        </div>
      </header>

      <div class="chat-workspace-layout">
        <aside class="chat-workspace-sidebar">
          <ChatHistoryPanel
            :conversations="conversations"
            :active-conversation-id="activeConversationId"
            :is-streaming="isStreaming"
            :is-loading="isLoadingConversations"
            @create="handleCreateConversation"
            @select="handleSelectConversation"
          />
        </aside>

        <main class="chat-workspace-main">
          <ChatConversationPanel
            :conversation="activeConversation"
            :draft-message="draftMessage"
            :is-streaming="isStreaming"
            :error-message="errorMessage"
            :is-loading-conversation="isLoadingConversation"
            @submit="handleSubmit"
            @stop="stopStreaming"
            @update:draft-message="draftMessage = $event"
          />
        </main>

        <aside class="chat-workspace-knowledge">
          <KnowledgePanel
            :documents="documents"
            @remove-document="handleRemoveDocument"
            @upload-files="handleUploadFiles"
          />
        </aside>
      </div>
    </div>
  </div>
</template>
