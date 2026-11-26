import type { BrainstormingSessionApiResponse, SessionContextResponse } from "../types";

const SESSIONS_ENDPOINT = "/api/brainstorming-sessions";

export class BrainApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "BrainApiError";
  }
}

async function createApiError(response: Response): Promise<BrainApiError> {
  let message = response.statusText || "Permintaan API gagal.";

  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      message = body.error;
    }
  } catch {
    // Keep the status text when the endpoint does not return a JSON error body.
  }

  return new BrainApiError(message, response.status);
}

export async function getBrainstormingSessions(): Promise<BrainstormingSessionApiResponse[]> {
  const response = await fetch(SESSIONS_ENDPOINT, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) throw await createApiError(response);
  return response.json() as Promise<BrainstormingSessionApiResponse[]>;
}

export async function getSessionContext(): Promise<SessionContextResponse> {
  const response = await fetch("/api/session");
  if (!response.ok) throw await createApiError(response);
  return response.json() as Promise<SessionContextResponse>;
}

export async function createBrainstormingSession(
  session: Pick<BrainstormingSessionApiResponse, "title" | "description" | "coverColor">
): Promise<void> {
  const response = await fetch(SESSIONS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });

  const data: unknown = await response.json();
  if (!response.ok) {
    let message = "Permintaan API gagal.";
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      message = data.error;
    }
    throw new BrainApiError(message, response.status);
  }
}

export async function updateBrainstormingSession(
  sessionId: string,
  updates: Pick<BrainstormingSessionApiResponse, "title" | "description" | "coverColor">
): Promise<void> {
  const response = await fetch(`${SESSIONS_ENDPOINT}/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw await createApiError(response);
}

export async function deleteBrainstormingSession(sessionId: string): Promise<void> {
  const response = await fetch(`${SESSIONS_ENDPOINT}/${sessionId}`, { method: "DELETE" });
  if (!response.ok) throw await createApiError(response);
}

export async function getUser(){
  const response = await fetch("/api/user");
  if(!response.ok) throw await createApiError(response);
  return response.json();
}