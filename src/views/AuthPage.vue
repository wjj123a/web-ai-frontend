<script setup>
import { computed, reactive, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { login, register } from "../services/auth";
import { saveSession } from "../services/session";

const MIN_AUTH_LENGTH = 6;
const route = useRoute();
const router = useRouter();
const submitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const loginForm = reactive({
  username: "",
  password: "",
});

const registerForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

const currentMode = computed(() => {
  return route.query.mode === "register" ? "register" : "login";
});

const panelTitle = computed(() => {
  return currentMode.value === "login" ? "欢迎回来" : "创建你的 AI 账号";
});

const submitLabel = computed(() => {
  return currentMode.value === "login" ? "登录" : "注册";
});

watch(
  () => route.query.mode,
  () => {
    errorMessage.value = "";
  },
  {
    immediate: true,
  },
);

function switchMode(mode) {
  router.replace({
    path: "/auth",
    query: {
      mode,
    },
  });
}

function validateForm() {
  const username = currentMode.value === "login" ? loginForm.username.trim() : registerForm.username.trim();
  const password = currentMode.value === "login" ? loginForm.password : registerForm.password;

  if (username.length < MIN_AUTH_LENGTH) {
    errorMessage.value = `用户名至少需要 ${MIN_AUTH_LENGTH} 位`;
    return false;
  }

  if (password.length < MIN_AUTH_LENGTH) {
    errorMessage.value = `密码至少需要 ${MIN_AUTH_LENGTH} 位`;
    return false;
  }

  if (currentMode.value === "register" && registerForm.confirmPassword.length < MIN_AUTH_LENGTH) {
    errorMessage.value = `确认密码至少需要 ${MIN_AUTH_LENGTH} 位`;
    return false;
  }

  return true;
}

async function handleSubmit() {
  if (submitting.value) {
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";

  if (!validateForm()) {
    return;
  }

  if (currentMode.value === "register") {
    if (registerForm.password !== registerForm.confirmPassword) {
      errorMessage.value = "两次输入的密码不一致";
      return;
    }

    submitting.value = true;

    try {
      const response = await register({
        username: registerForm.username,
        password: registerForm.password,
      });

      loginForm.username = registerForm.username;
      loginForm.password = "";
      registerForm.password = "";
      registerForm.confirmPassword = "";
      switchMode("login");
      successMessage.value = `账号 ${response.username} 注册成功，请直接登录`;
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : "注册失败，请稍后重试";
    } finally {
      submitting.value = false;
    }

    return;
  }

  submitting.value = true;

  try {
    const response = await login({
      username: loginForm.username,
      password: loginForm.password,
    });

    const expiresAt = new Date(Date.now() + Number(response.expires_in || 0) * 1000).toISOString();

    saveSession({
      accessToken: response.access_token,
      tokenType: response.token_type,
      username: loginForm.username,
      expiresAt,
    });
    successMessage.value = "登录成功，正在返回首页";

    window.setTimeout(() => {
      router.push("/");
    }, 600);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "登录失败，请稍后重试";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-shell">
      <section class="auth-showcase">
        <RouterLink class="auth-brand" to="/">w.ai</RouterLink>

        <div class="auth-orbits" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </section>

      <section class="auth-panel">
        <div class="auth-panel-header">
          <RouterLink class="auth-back" to="/">返回首页</RouterLink>
          <div class="auth-mode-switch" role="tablist" aria-label="认证模式">
            <button
              class="auth-mode-button"
              :class="{ 'is-active': currentMode === 'login' }"
              type="button"
              @click="switchMode('login')"
            >
              登录
            </button>
            <button
              class="auth-mode-button"
              :class="{ 'is-active': currentMode === 'register' }"
              type="button"
              @click="switchMode('register')"
            >
              注册
            </button>
          </div>
        </div>

        <div class="auth-panel-body">
          <div class="auth-heading">
            <h2>{{ panelTitle }}</h2>
          </div>

          <form class="auth-form" @submit.prevent="handleSubmit">
            <label class="auth-field">
              <span>用户名</span>
              <input
                v-if="currentMode === 'login'"
                v-model.trim="loginForm.username"
                type="text"
                autocomplete="username"
                minlength="6"
                maxlength="32"
                placeholder="请输入至少 6 位用户名"
                required
              />
              <input
                v-else
                v-model.trim="registerForm.username"
                type="text"
                autocomplete="username"
                minlength="6"
                maxlength="32"
                placeholder="请设置至少 6 位用户名"
                required
              />
            </label>

            <label class="auth-field">
              <span>密码</span>
              <input
                v-if="currentMode === 'login'"
                v-model="loginForm.password"
                type="password"
                autocomplete="current-password"
                minlength="6"
                maxlength="128"
                placeholder="请输入至少 6 位密码"
                required
              />
              <input
                v-else
                v-model="registerForm.password"
                type="password"
                autocomplete="new-password"
                minlength="6"
                maxlength="128"
                placeholder="请设置至少 6 位密码"
                required
              />
            </label>

            <label v-if="currentMode === 'register'" class="auth-field">
              <span>确认密码</span>
              <input
                v-model="registerForm.confirmPassword"
                type="password"
                autocomplete="new-password"
                minlength="6"
                maxlength="128"
                placeholder="请再次输入至少 6 位密码"
                required
              />
            </label>

            <p v-if="errorMessage" class="auth-feedback is-error">{{ errorMessage }}</p>
            <p v-if="successMessage" class="auth-feedback is-success">{{ successMessage }}</p>

            <button class="auth-submit" type="submit" :disabled="submitting">
              {{ submitting ? "提交中..." : submitLabel }}
            </button>
          </form>

          <p class="auth-footer-tip">
            {{ currentMode === "login" ? "还没有账号？" : "已经有账号了？" }}
            <button
              class="auth-inline-button"
              type="button"
              @click="switchMode(currentMode === 'login' ? 'register' : 'login')"
            >
              {{ currentMode === "login" ? "立即注册" : "直接登录" }}
            </button>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
