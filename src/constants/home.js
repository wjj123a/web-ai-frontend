export const navItems = [
  "关于我们",
  "能力矩阵",
  "客户案例",
  "模型定价",
  "解决方案",
  "开发文档",
  "联系我们",
];

export const sceneTabs = [
  {
    mode: "ai",
    label: "智能体编排",
    note: "当前聚焦：把提示词、工具调用和执行结果收束到一条可追踪的工作流里。",
  },
  {
    mode: "iot",
    label: "知识检索",
    note: "当前聚焦：让文档、数据库和业务知识在回答之前先被命中与引用。",
  },
  {
    mode: "community",
    label: "模型路由",
    note: "当前聚焦：根据任务难度、成本和速度，把请求自动分发到更合适的模型。",
  },
];

export const sceneBadges = {
  left: {
    label: "平均延迟",
    value: "0.8 秒响应",
  },
  right: {
    label: "今日工作流",
    value: "12 条已发布",
  },
};
