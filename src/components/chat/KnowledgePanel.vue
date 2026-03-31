<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  documents: {
    type: Array,
    default: () => [],
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
        <h2>知识库</h2>
      </div>
    </div>

    <div class="knowledge-stats">
      <article class="knowledge-stat-card">
        <span>文档数量</span>
        <strong>{{ props.documents.length }}</strong>
      </article>
      <article class="knowledge-stat-card">
        <span>最近更新</span>
        <strong>{{ lastUpdatedText }}</strong>
      </article>
    </div>

    <div class="knowledge-upload-card">
      <div>
        <strong>上传文档</strong>
      </div>
      <button class="chat-primary-button is-compact" type="button" @click="openFilePicker">
        选择文件
      </button>
      <input
        ref="uploadInput"
        class="knowledge-upload-input"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.md,.txt"
        @change="handleFileChange"
      />
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
          @click="emit('remove-document', document.id)"
        >
          删除
        </button>
      </article>

      <div v-if="!props.documents.length" class="knowledge-document-empty"></div>
    </div>
  </section>
</template>
