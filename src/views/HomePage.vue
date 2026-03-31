<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import HeroIllustration from "../components/HeroIllustration.vue";
import SiteHeader from "../components/SiteHeader.vue";
import { navItems, sceneBadges, sceneTabs } from "../constants/home";
import { useSession } from "../services/session";

const activeMode = ref(sceneTabs[0].mode);
const pointerX = ref(0);
const pointerY = ref(0);
const allowPointerMotion = ref(false);
let motionMediaQuery = null;
const session = useSession();

const activeScene = computed(() => {
  return sceneTabs.find((item) => item.mode === activeMode.value) ?? sceneTabs[0];
});

const isLoggedIn = computed(() => {
  return Boolean(session.accessToken && session.username && session.expiresAt);
});

const primaryAction = computed(() => {
  if (isLoggedIn.value) {
    return {
      to: "/workspace",
      label: "进入工作台",
    };
  }

  return {
    to: "/auth?mode=register",
    label: "立即体验",
  };
});

const heroStyle = computed(() => {
  return {
    "--pointer-x": pointerX.value.toFixed(3),
    "--pointer-y": pointerY.value.toFixed(3),
  };
});

function updateMotionCapability() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canTrackPointer = window.matchMedia("(pointer: fine)").matches;
  allowPointerMotion.value = !prefersReducedMotion && canTrackPointer;
}

function setActiveScene(mode) {
  activeMode.value = mode;
}

function handlePointerMove(event) {
  if (!allowPointerMotion.value) {
    return;
  }

  const bounds = event.currentTarget.getBoundingClientRect();
  pointerX.value = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
  pointerY.value = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
}

function resetPointer() {
  pointerX.value = 0;
  pointerY.value = 0;
}

onMounted(() => {
  motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  updateMotionCapability();

  if (typeof motionMediaQuery.addEventListener === "function") {
    motionMediaQuery.addEventListener("change", updateMotionCapability);
    return;
  }

  motionMediaQuery.addListener(updateMotionCapability);
});

onBeforeUnmount(() => {
  if (!motionMediaQuery) {
    return;
  }

  if (typeof motionMediaQuery.removeEventListener === "function") {
    motionMediaQuery.removeEventListener("change", updateMotionCapability);
    return;
  }

  motionMediaQuery.removeListener(updateMotionCapability);
});
</script>

<template>
  <div class="page-shell">
    <main
      class="hero-shell"
      :data-mode="activeScene.mode"
      :style="heroStyle"
      @pointermove="handlePointerMove"
      @pointerleave="resetPointer"
    >
      <SiteHeader :nav-items="navItems" />

      <section class="hero-content">
        <div class="hero-tabs" role="tablist" aria-label="核心场景">
          <button
            v-for="scene in sceneTabs"
            :key="scene.mode"
            class="hero-tab"
            :class="{ 'is-active': scene.mode === activeScene.mode }"
            type="button"
            @click="setActiveScene(scene.mode)"
          >
            {{ scene.label }}
          </button>
        </div>

        <h1 class="hero-title">
          让 AI 能力真正
          <span>协同运行</span>
        </h1>

        <p class="hero-description">
          为团队搭建可落地的 AI 产品界面，用清晰的编排、检索和路由，把实验性的能力收束成稳定流程。
        </p>

        <div class="hero-actions">
          <RouterLink class="primary-button" :to="primaryAction.to">{{ primaryAction.label }}</RouterLink>
          <RouterLink v-if="!isLoggedIn" class="ghost-button hero-watch" to="/auth?mode=login">
            <span class="play-icon" aria-hidden="true"></span>
            <span>前往登录</span>
          </RouterLink>
        </div>
      </section>

      <HeroIllustration :left-badge="sceneBadges.left" :right-badge="sceneBadges.right" />
    </main>
  </div>
</template>
