/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  RAILWAY_API_BASE_URL?: string;
}
