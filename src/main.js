import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import App from "./App.vue";
import { hydrateSession } from "./services/session";
import AuthPage from "./views/AuthPage.vue";
import ChatPage from "./views/ChatPage.vue";
import HomePage from "./views/HomePage.vue";
import WorkspacePage from "./views/WorkspacePage.vue";
import "./styles/main.css";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: HomePage,
    },
    {
      path: "/auth",
      component: AuthPage,
    },
    {
      path: "/workspace",
      component: WorkspacePage,
    },
    {
      path: "/workspace/chat",
      component: ChatPage,
    },
  ],
});

hydrateSession();

createApp(App).use(router).mount("#app");
