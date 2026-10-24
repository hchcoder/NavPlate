import { fetch } from "expo/fetch";

// The C# backend (backend/). localhost only works on web and the iOS simulator.
// On a phone, set EXPO_PUBLIC_API_URL in .env.local to your computer's IP,
// e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:5149, then restart `expo start`.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5149";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined && { "Content-Type": "application/json" }),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // No response at all: server down, wrong URL, or no internet.
    throw new ApiError("Couldn't reach the server.", 0);
  }

  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status}).`, response.status);
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body }),
};
