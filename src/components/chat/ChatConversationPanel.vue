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
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  temporaryFileName: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "update:draftMessage",
  "submit",
  "stop",
  "select-temporary-file",
  "clear-temporary-file",
]);

const messageScroller = ref(null);
const temporaryUploadInput = ref(null);

const messages = computed(() => {
  return Array.isArray(props.conversation?.messages) ? props.conversation.messages : [];
});

const statusText = computed(() => {
  if (props.isStreaming) {
    return "正在生成回复";
  }

  if (props.isSubmitting) {
    return "正在分析文档";
  }

  return "已连接";
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

function openTemporaryFilePicker() {
  temporaryUploadInput.value?.click();
}

function handleTemporaryFileChange(event) {
  const file = event.target.files?.[0] ?? null;

  if (file) {
    emit("select-temporary-file", file);
  }

  event.target.value = "";
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

      <div class="chat-conversation-status" :class="{ 'is-streaming': props.isStreaming || props.isSubmitting }">
        {{ statusText }}
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
      <div class="chat-composer-head">
        <div class="chat-composer-head-left">
          <label class="chat-composer-label" for="chat-message-input">输入问题</label>
          <div v-if="props.temporaryFileName" class="chat-composer-attachment">
            <span class="chat-composer-attachment-name">{{ props.temporaryFileName }}</span>
            <button
              class="chat-composer-attachment-remove"
              type="button"
              :disabled="props.isSubmitting"
              aria-label="移除已选文件"
              title="移除已选文件"
              @click="emit('clear-temporary-file')"
            >
              x
            </button>
          </div>
        </div>

        <div class="chat-composer-tools">
          <button
            class="chat-secondary-button chat-upload-icon-button"
            type="button"
            :disabled="props.isSubmitting"
            aria-label="选择临时分析文档"
            title="选择临时分析文档"
            @click="openTemporaryFilePicker"
          >
            <span class="chat-upload-icon" aria-hidden="true">+</span>
          </button>
          <input
            ref="temporaryUploadInput"
            class="chat-composer-upload-input"
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            @change="handleTemporaryFileChange"
          />
        </div>
      </div>

      <div class="chat-composer-field">
        <textarea
          id="chat-message-input"
          class="chat-composer-input"
          :value="props.draftMessage"
          :disabled="props.isSubmitting"
          rows="3"
          maxlength="4000"
          placeholder="输入你的问题，例如：帮我总结这份需求，并给出可执行的前端实现方案。"
          @input="handleInput"
          @keydown="handleKeydown"
        ></textarea>

        <div class="chat-composer-actions">
          <div class="chat-composer-submit-actions">
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
              :disabled="props.isSubmitting || !props.draftMessage.trim()"
              @click="emit('submit')"
            >
              发送消息
            </button>
          </div>
        </div>
      </div>
    </footer>
  </section>
</template>
