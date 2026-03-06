import { onRequestPost as __api_chat_js_onRequestPost } from "D:\\reverion-project\\solvischat\\functions\\api\\chat.js"

export const routes = [
    {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_js_onRequestPost],
    },
  ]