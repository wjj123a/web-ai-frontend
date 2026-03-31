<script setup>
import { RouterLink } from "vue-router";

const props = defineProps({
  conversations: {
    type: Array,
    default: () => [],
  },
  activeConversationId: {
    type: String,
    default: "",
  },
  isStreaming: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select", "create"]);

function getPreview(conversation) {
  if (conversation.preview) {
    return conversation.preview;
  }

  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage?.content) {
    return conversation.messagesLoaded ? "等待第一条提问" : "点击查看历史消息";
  }

  const preview = String(lastMessage.content).replace(/\s+/g, " ").trim();
  return preview.length > 24 ? `${preview.slice(0, 24)}…` : preview;
}

function formatConversationTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
</script>

<template>
  <section class="chat-history-panel">
    <div class="chat-history-panel-head">
      <RouterLink class="chat-back-link" to="/workspace">
        <span aria-hidden="true">←</span>
        <span>返回 AI 工具</span>
      </RouterLink>

      <button class="chat-create-button" type="button" :disabled="props.isStreaming" @click="emit('create')">
        新建对话
      </button>
    </div>

    <div class="chat-history-panel-title">
      <h2>聊天记录</h2>
      <span>{{ props.isLoading ? "加载中..." : `${props.conversations.length} 个会话` }}</span>
    </div>

    <div v-if="props.conversations.length" class="chat-history-list">
      <button
        v-for="conversation in props.conversations"
        :key="conversation.id"
        class="chat-history-item"
        :class="{ 'is-active': conversation.id === props.activeConversationId }"
        type="button"
        :disabled="props.isStreaming && conversation.id !== props.activeConversationId"
        @click="emit('select', conversation.id)"
      >
        <div class="chat-history-item-top">
          <strong>{{ conversation.title || "新对话" }}</strong>
          <span>{{ formatConversationTime(conversation.updatedAt) }}</span>
        </div>
        <p>{{ getPreview(conversation) }}</p>
      </button>
    </div>

    <div v-else class="chat-history-empty">
      <strong>还没有历史对话</strong>
      <p>从右侧输入你的第一个问题，系统会自动生成会话记录。</p>
    </div>
  </section>
</template>
