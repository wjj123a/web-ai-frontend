import { reactive } from "vue";

const STORAGE_KEY = "w_ai_session";

const state = reactive({
  accessToken: "",
  tokenType: "bearer",
  username: "",
  expiresAt: "",
});

function readStoredSession() {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function applySession(payload) {
  state.accessToken = payload.accessToken || "";
  state.tokenType = payload.tokenType || "bearer";
  state.username = payload.username || "";
  state.expiresAt = payload.expiresAt || "";
}

function isExpired(expiresAt) {
  if (!expiresAt) {
    return true;
  }

  return Date.now() >= new Date(expiresAt).getTime();
}

export function hydrateSession() {
  const storedSession = readStoredSession();

  if (!storedSession) {
    clearSession();
    return;
  }

  if (isExpired(storedSession.expiresAt)) {
    clearSession();
    return;
  }

  applySession(storedSession);
}

export function saveSession(payload) {
  applySession(payload);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      tokenType: state.tokenType,
      username: state.username,
      expiresAt: state.expiresAt,
    }),
  );
}

export function clearSession() {
  applySession({
    accessToken: "",
    tokenType: "bearer",
    username: "",
    expiresAt: "",
  });
  window.localStorage.removeItem(STORAGE_KEY);
}

export function useSession() {
  return state;
}
