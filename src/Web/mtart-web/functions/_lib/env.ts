/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  RAILWAY_API_BASE_URL?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
}
