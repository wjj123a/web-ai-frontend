const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const FIELD_LABELS = {
  username: "用户名",
  password: "密码",
};

function formatValidationItem(item) {
  if (!item || typeof item !== "object") {
    return "请求参数不合法";
  }

  const fieldName = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
  const fieldLabel = FIELD_LABELS[fieldName] || "输入项";

  if (item.type === "string_too_short") {
    const minLength = item.ctx?.min_length ?? 0;
    return `${fieldLabel}至少需要 ${minLength} 位`;
  }

  if (item.type === "missing") {
    return `${fieldLabel}不能为空`;
  }

  if (typeof item.msg === "string" && item.msg.trim()) {
    return `${fieldLabel}${item.msg}`;
  }

  return `${fieldLabel}格式不正确`;
}

function formatErrorDetail(detail) {
  if (Array.isArray(detail)) {
    return detail.map(formatValidationItem).join("；");
  }

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (detail && typeof detail === "object" && typeof detail.message === "string") {
    return detail.message;
  }

  return "请求失败，请稍后重试";
}

async function request(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => {
    return {};
  });

  if (!response.ok) {
    throw new Error(formatErrorDetail(data.detail));
  }

  return data;
}

export function login(payload) {
  return request("/auth/login", payload);
}

export function register(payload) {
  return request("/auth/register", payload);
}
