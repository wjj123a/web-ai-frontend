<script setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  conversation: {
    type: Object,
    default: null,
  },
  draftMessage: {
    type: String,
    default: "",
  },
  isStreaming: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  isLoadingConversation: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:draftMessage", "submit", "stop"]);

const messageScroller = ref(null);

const messages = computed(() => {
  return Array.isArray(props.conversation?.messages) ? props.conversation.messages : [];
});

function handleInput(event) {
  emit("update:draftMessage", event.target.value);
}

function handleKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  event.preventDefault();
  emit("submit");
}

function scrollToBottom() {
  if (!messageScroller.value) {
    return;
  }

  messageScroller.value.scrollTop = messageScroller.value.scrollHeight;
}

watch(
  () => [
    props.conversation?.id,
    props.isStreaming,
    messages.value.map((message) => `${message.id}:${message.content.length}`).join("|"),
  ],
  async () => {
    await nextTick();
    scrollToBottom();
  },
  { immediate: true },
);
</script>

<template>
  <section class="chat-conversation-panel">
    <header class="chat-conversation-head">
      <div>
        <h1>{{ props.conversation?.title || "智能对话" }}</h1>
      </div>

      <div class="chat-conversation-status" :class="{ 'is-streaming': props.isStreaming }">
        {{ props.isStreaming ? "正在生成回复" : "已连接" }}
      </div>
    </header>

    <div ref="messageScroller" class="chat-message-list">
      <div v-if="messages.length" class="chat-message-stack">
        <article
          v-for="message in messages"
          :key="message.id"
          class="chat-message"
          :class="{
            'is-user': message.role === 'user',
            'is-assistant': message.role === 'assistant',
          }"
        >
          <div class="chat-message-meta">
            <span>{{ message.role === "user" ? "你" : "w.ai" }}</span>
          </div>
          <div
            v-if="message.role === 'assistant' && Array.isArray(message.sections) && message.sections.length"
            class="chat-message-sections"
          >
            <section
              v-for="section in message.sections"
              :key="section.key"
              class="chat-message-section"
            >
              <span class="chat-message-section-label">{{ section.label }}</span>
              <p>{{ section.content }}</p>
            </section>
          </div>
          <div
            v-if="message.role === 'user' || message.content || !(Array.isArray(message.sections) && message.sections.length)"
            class="chat-message-bubble"
          >
            <p>{{ message.content }}</p>
          </div>
        </article>
      </div>

      <div v-else-if="props.isLoadingConversation" class="chat-message-empty">
        <span class="chat-message-empty-badge">历史消息</span>
        <h2>正在加载会话</h2>
        <p>稍等一下，当前会话的消息记录正在从服务端读取。</p>
      </div>

      <div v-else class="chat-message-empty"></div>
    </div>

    <div v-if="props.errorMessage" class="chat-error-banner">
      {{ props.errorMessage }}
    </div>

    <footer class="chat-composer">
      <label class="chat-composer-label" for="chat-message-input">输入问题</label>
      <div class="chat-composer-field">
        <textarea
          id="chat-message-input"
          class="chat-composer-input"
          :value="props.draftMessage"
          :disabled="props.isStreaming"
          rows="3"
          maxlength="4000"
          placeholder="输入你的问题，例如：帮我总结这份需求，并给出可执行的前端实现方案。"
          @input="handleInput"
          @keydown="handleKeydown"
        ></textarea>

        <div class="chat-composer-actions">
          <button
            v-if="props.isStreaming"
            class="chat-secondary-button"
            type="button"
            @click="emit('stop')"
          >
            停止生成
          </button>

          <button
            v-else
            class="chat-primary-button"
            type="button"
            :disabled="!props.draftMessage.trim()"
            @click="emit('submit')"
          >
            发送消息
          </button>
        </div>
      </div>
    </footer>
  </section>
</template>
