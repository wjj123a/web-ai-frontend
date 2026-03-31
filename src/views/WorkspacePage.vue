<script setup>
import { computed, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { clearSession, useSession } from "../services/session";

const router = useRouter();
const session = useSession();

const isLoggedIn = computed(() => {
  return Boolean(session.accessToken && session.username && session.expiresAt);
});

const tools = [
  {
    key: "chat",
    title: "智能对话",
    description: "与 AI 助手进行自然语言对话，快速获得帮助、建议和任务拆解。",
    colorClass: "is-blue",
  },
  {
    key: "image",
    title: "图像生成",
    description: "使用 AI 生成创意图像、产品插图和视觉灵感方案。",
    colorClass: "is-violet",
  },
  {
    key: "code",
    title: "代码助手",
    description: "获取代码建议、调试思路和技术文档支持，提升开发效率。",
    colorClass: "is-green",
  },
  {
    key: "writing",
    title: "创意写作",
    description: "辅助生成文章、故事和营销文案，让灵感更快落地。",
    colorClass: "is-orange",
  },
];

function handleLogout() {
  clearSession();
  router.push("/auth?mode=login");
}

function handleToolClick(toolKey) {
  if (toolKey !== "chat") {
    return;
  }

  router.push("/workspace/chat");
}

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace("/auth?mode=login");
  }
});
</script>

<template>
  <div class="workspace-page">
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

      <div class="workspace-layout">
        <aside class="workspace-sidebar">
          <button class="workspace-nav-item is-active" type="button">
            <span class="workspace-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4.25" y="5.25" width="11.5" height="9.5" rx="2.25" stroke="currentColor" stroke-width="1.8" />
                <path d="M7 5V3.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M13 5V3.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M7.25 9.5H12.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <span>AI 工具</span>
          </button>
        </aside>

        <main class="workspace-main">
          <section class="workspace-intro">
            <h1>AI 工具</h1>
            <p>探索强大的 AI 工具，用统一的界面快速进入不同能力模块。</p>
          </section>

          <section class="workspace-grid">
            <article
              v-for="tool in tools"
              :key="tool.key"
              class="tool-card"
              :class="{ 'is-clickable': tool.key === 'chat' }"
              :role="tool.key === 'chat' ? 'button' : undefined"
              :tabindex="tool.key === 'chat' ? 0 : undefined"
              @click="handleToolClick(tool.key)"
              @keydown.enter.prevent="handleToolClick(tool.key)"
              @keydown.space.prevent="handleToolClick(tool.key)"
            >
              <div class="tool-card-icon" :class="tool.colorClass">
                <svg v-if="tool.key === 'chat'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.75 8.75C6.75 7.64543 7.64543 6.75 8.75 6.75H15.25C16.3546 6.75 17.25 7.64543 17.25 8.75V13.25C17.25 14.3546 16.3546 15.25 15.25 15.25H11L8 17.75V15.25H8.75C7.64543 15.25 6.75 14.3546 6.75 13.25V8.75Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                </svg>
                <svg v-else-if="tool.key === 'image'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5.25" y="6.25" width="13.5" height="11.5" rx="2.25" stroke="currentColor" stroke-width="1.8" />
                  <circle cx="9" cy="10" r="1.25" fill="currentColor" />
                  <path d="M7.25 15.75L11 12.25L13.75 14.75L15.5 13.25L16.75 14.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <svg v-else-if="tool.key === 'code'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 8L6 12L9.5 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M14.5 8L18 12L14.5 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5.5L12.9 8.35L15.75 9.25L12.9 10.15L12 13L11.1 10.15L8.25 9.25L11.1 8.35L12 5.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                  <path d="M17 13L17.55 14.7L19.25 15.25L17.55 15.8L17 17.5L16.45 15.8L14.75 15.25L16.45 14.7L17 13Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                </svg>
              </div>

              <div class="tool-card-body">
                <h2>{{ tool.title }}</h2>
                <p>{{ tool.description }}</p>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>
