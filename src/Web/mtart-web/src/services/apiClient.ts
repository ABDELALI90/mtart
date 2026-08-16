import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { PagedResult } from '@/types/pagination';

/**
 * Every backend call goes through this client. Base URL is the YARP Gateway
 * (`VITE_API_BASE_URL`). Paths already include `/api/v1/...`.
 *
 * Empty / `/api` uses same-origin so Vite can proxy `/api` → gateway :8080.
 * Direct `http://localhost:8080` talks to the Docker (or local) gateway.
 */
function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured || configured === '/api') {
    return '';
  }
  return configured.replace(/\/$/, '');
}

const baseURL = resolveApiBaseUrl();

if (typeof console !== 'undefined') {
  console.info('[MT ART API] base URL:', baseURL || '(same-origin / Vite proxy)');
}

function omitEmptyParams(params: unknown): unknown {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return params;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 20_000,
  headers: {
    Accept: 'application/json',
  },
});

/** RFC 7807 ProblemDetails shape returned by every MT ART API on failure. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status?: number;
  url?: string;
  method?: string;
  problem?: ProblemDetails;

  constructor(message: string, status?: number, problem?: ProblemDetails, url?: string, method?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
    this.url = url;
    this.method = method;
  }
}

function requestUrl(config?: InternalAxiosRequestConfig): string {
  if (!config) {
    return '(unknown url)';
  }

  const joined = config.baseURL ? `${config.baseURL.replace(/\/$/, '')}${config.url ?? ''}` : (config.url ?? '(unknown url)');
  const params = omitEmptyParams(config.params) as Record<string, unknown> | undefined;
  if (!params || Object.keys(params).length === 0) {
    return joined;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.append(key, String(value));
  }
  return `${joined}?${search.toString()}`;
}

export function formatApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const status = error.status ? `HTTP ${error.status}` : 'network/CORS';
    const where = error.url ? ` ${error.method ?? 'GET'} ${error.url}` : '';
    return `${fallback} (${status}${where})`;
  }
  if (error instanceof Error && error.message) {
    return `${fallback} (${error.message})`;
  }
  return fallback;
}

export function expectArray<T>(data: unknown, path: string): T[] {
  if (!Array.isArray(data)) {
    const preview =
      typeof data === 'string' ? data.slice(0, 160) : data === null ? 'null' : typeof data;
    console.error(`[MT ART API] GET ${path} → expected JSON array, got ${typeof data}`, data);
    throw new ApiError(`Expected an array from ${path}, got ${preview}`, 500, undefined, path, 'GET');
  }
  return data;
}

export function expectPaged<T>(data: unknown, path: string): PagedResult<T> {
  if (!data || typeof data !== 'object' || !Array.isArray((data as PagedResult<T>).items)) {
    console.error(`[MT ART API] GET ${path} → expected paged result with items[]`, data);
    throw new ApiError(`Expected a paged result from ${path}`, 500, undefined, path, 'GET');
  }
  return data as PagedResult<T>;
}

apiClient.interceptors.request.use((config) => {
  config.params = omitEmptyParams(config.params);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetails>) => {
    const url = requestUrl(error.config);
    const method = (error.config?.method ?? 'GET').toUpperCase();

    if (error.response) {
      const problem = error.response.data;
      const status = error.response.status;
      const message = problem?.detail || problem?.title || error.message || 'Unexpected server error.';
      console.error(`[MT ART API] ${method} ${url} → HTTP ${status}`, problem ?? error.response.data);
      return Promise.reject(new ApiError(message, status, problem, url, method));
    }

    if (error.request) {
      console.error(`[MT ART API] ${method} ${url} → no response (network/CORS/gateway down)`, error.message);
      return Promise.reject(
        new ApiError(
          `Unable to reach the MT ART server at ${url || 'the API gateway'}. Check VITE_API_BASE_URL and that the gateway is running.`,
          undefined,
          undefined,
          url,
          method,
        ),
      );
    }

    console.error(`[MT ART API] ${method} ${url} → ${error.message}`);
    return Promise.reject(new ApiError(error.message || 'Unexpected error.', undefined, undefined, url, method));
  },
);

export default apiClient;
