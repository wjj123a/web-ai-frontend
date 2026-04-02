<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  documents: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isUploading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["upload-files", "remove-document"]);

const uploadInput = ref(null);

const lastUpdatedText = computed(() => {
  if (!props.documents.length) {
    return "";
  }

  const latestDocument = [...props.documents].sort((left, right) => {
    return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
  })[0];

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(latestDocument.uploadedAt));
});

function openFilePicker() {
  uploadInput.value?.click();
}

function formatFileSize(size) {
  if (!size) {
    return "0 KB";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function handleFileChange(event) {
  const files = Array.from(event.target.files ?? []);

  if (files.length) {
    emit("upload-files", files);
  }

  event.target.value = "";
}
</script>

<template>
  <section class="knowledge-panel">
    <div class="knowledge-panel-head">
      <div>
        <h2>长期知识库</h2>
      </div>
    </div>

    <div class="knowledge-stats">
      <article class="knowledge-stat-card">
        <span>文档数量</span>
        <strong>{{ props.documents.length }}</strong>
      </article>
      <article class="knowledge-stat-card">
        <span>最近更新</span>
        <strong>{{ props.isLoading ? "加载中..." : lastUpdatedText }}</strong>
      </article>
    </div>

    <div class="knowledge-upload-card">
      <div>
        <strong>加入长期知识库</strong>
        <p>当前仅支持 `txt` / `md`，上传后会进入长期知识库供后续对话检索。</p>
      </div>
      <button
        class="chat-primary-button is-compact"
        type="button"
        :disabled="props.isUploading"
        @click="openFilePicker"
      >
        {{ props.isUploading ? "上传中..." : "选择文件" }}
      </button>
      <input
        ref="uploadInput"
        class="knowledge-upload-input"
        type="file"
        multiple
        accept=".md,.txt,text/markdown,text/plain"
        @change="handleFileChange"
      />
    </div>

    <div v-if="props.errorMessage" class="chat-error-banner">
      {{ props.errorMessage }}
    </div>

    <div class="knowledge-document-list">
      <article v-for="document in props.documents" :key="document.id" class="knowledge-document-item">
        <div class="knowledge-document-meta">
          <strong>{{ document.name }}</strong>
          <span>{{ formatFileSize(document.size) }} / {{ document.typeLabel }}</span>
        </div>
        <button
          class="knowledge-remove-button"
          type="button"
          :disabled="props.isUploading"
          @click="emit('remove-document', document.id)"
        >
          删除
        </button>
      </article>

      <div v-if="!props.documents.length" class="knowledge-document-empty"></div>
    </div>
  </section>
</template>
