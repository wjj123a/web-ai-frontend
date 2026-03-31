<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { clearSession, useSession } from "../services/session";

const props = defineProps({
  navItems: {
    type: Array,
    required: true,
  },
});

const menuOpen = ref(false);
const router = useRouter();
const session = useSession();

const isLoggedIn = computed(() => {
  return Boolean(session.accessToken && session.username && session.expiresAt);
});

function closeMenu() {
  menuOpen.value = false;
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function handleResize() {
  if (window.innerWidth > 1080) {
    closeMenu();
  }
}

function handleLogout() {
  clearSession();
  closeMenu();
  router.push("/auth?mode=login");
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <header class="site-header">
    <a class="brand" href="#" aria-label="w.ai 首页">
      <span class="brand-mark" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span class="brand-text">w.ai</span>
    </a>

    <nav class="desktop-nav" aria-label="主导航">
      <a v-for="item in props.navItems" :key="item" href="#">{{ item }}</a>
    </nav>

    <div class="header-actions">
      <template v-if="isLoggedIn">
        <span class="user-pill">{{ session.username }}</span>
        <button class="primary-button logout-button" type="button" @click="handleLogout">退出</button>
      </template>
      <template v-else>
        <RouterLink class="ghost-button" to="/auth?mode=login">登录</RouterLink>
        <RouterLink class="primary-button" to="/auth?mode=register">立即体验</RouterLink>
      </template>
      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="String(menuOpen)"
        aria-label="切换移动端导航"
        @click="toggleMenu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <nav
    class="mobile-menu"
    :class="{ 'is-open': menuOpen }"
    aria-label="移动端导航"
    :aria-hidden="String(!menuOpen)"
    :inert="!menuOpen"
  >
    <a v-for="item in props.navItems" :key="item" href="#" @click="closeMenu">{{ item }}</a>

    <div class="mobile-menu-actions">
      <template v-if="isLoggedIn">
        <span class="user-pill mobile-user-pill">{{ session.username }}</span>
        <button class="primary-button logout-button" type="button" @click="handleLogout">退出登录</button>
      </template>
      <template v-else>
        <RouterLink class="ghost-button" to="/auth?mode=login" @click="closeMenu">登录</RouterLink>
        <RouterLink class="primary-button" to="/auth?mode=register" @click="closeMenu">立即体验</RouterLink>
      </template>
    </div>
  </nav>
</template>
