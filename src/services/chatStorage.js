const CHAT_DOCUMENTS_KEY = "w_ai_knowledge_documents";

function readStorage(key) {
  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadKnowledgeDocuments() {
  return readStorage(CHAT_DOCUMENTS_KEY);
}

export function saveKnowledgeDocuments(documents) {
  writeStorage(CHAT_DOCUMENTS_KEY, documents);
}

export function buildConversationTitle(message) {
  const normalizedMessage = String(message || "").trim().replace(/\s+/g, " ");

  if (!normalizedMessage) {
    return "新对话";
  }

  if (normalizedMessage.length <= 16) {
    return normalizedMessage;
  }

  return `${normalizedMessage.slice(0, 16)}…`;
}
