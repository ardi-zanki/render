"use client";

type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromPayload(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback;
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.message === "string") return payload.message;
  return fallback;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }

  get code() {
    return isRecord(this.payload) && typeof this.payload.code === "string"
      ? this.payload.code
      : undefined;
  }

  get data() {
    return this.payload;
  }
}

export async function apiJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const payload = await readJson(response);

  if (!response.ok) {
    throw new ApiClientError(
      messageFromPayload(payload, "Request gagal"),
      response.status,
      payload,
    );
  }

  return payload as T;
}

export function jsonInit(body: unknown, init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  return {
    ...init,
    headers,
    body: JSON.stringify(body),
  };
}

export function postJson<T>(
  input: RequestInfo | URL,
  body: unknown,
  init: RequestInit = {},
) {
  return apiJson<T>(
    input,
    jsonInit(body, {
      ...init,
      method: init.method ?? "POST",
    }),
  );
}

export function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function apiErrorData(error: unknown) {
  return error instanceof ApiClientError ? error.data : undefined;
}

export function apiFieldErrors(error: unknown) {
  const data = apiErrorData(error);
  if (!isRecord(data) || !isRecord(data.fieldErrors)) return undefined;

  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(data.fieldErrors)) {
    if (typeof value === "string") fieldErrors[key] = value;
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

export type { ApiErrorPayload };
