import { onRequestGet as __api_file___key___js_onRequestGet } from "/home/logic/Work/portfolio/functions/api/file/[[key]].js"
import { onRequestPost as __api_delete_js_onRequestPost } from "/home/logic/Work/portfolio/functions/api/delete.js"
import { onRequestGet as __api_list_js_onRequestGet } from "/home/logic/Work/portfolio/functions/api/list.js"
import { onRequestPost as __api_upload_js_onRequestPost } from "/home/logic/Work/portfolio/functions/api/upload.js"

export const routes = [
    {
      routePath: "/api/file/:key*",
      mountPath: "/api/file",
      method: "GET",
      middlewares: [],
      modules: [__api_file___key___js_onRequestGet],
    },
  {
      routePath: "/api/delete",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_delete_js_onRequestPost],
    },
  {
      routePath: "/api/list",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_list_js_onRequestGet],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_js_onRequestPost],
    },
  ]