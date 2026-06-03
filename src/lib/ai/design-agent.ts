export interface DesignAgentRequest {
  prompt: string;
  roomId: string;
  projectId: string;
}

interface DesignAgentValidationResult {
  data?: DesignAgentRequest;
  error?: string;
}

function readRequiredString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseDesignAgentRequest(
  body: unknown,
): DesignAgentValidationResult {
  if (!body || typeof body !== "object") {
    return { error: "Request body is required." };
  }

  const input = body as Record<string, unknown>;
  const prompt = readRequiredString(input.prompt);
  const roomId = readRequiredString(input.roomId);

  if (!prompt) {
    return { error: "Prompt is required." };
  }

  if (!roomId) {
    return { error: "Room ID is required." };
  }

  const projectId = readRequiredString(input.projectId) ?? roomId;

  return {
    data: {
      prompt,
      roomId,
      projectId,
    },
  };
}

export function parseDesignRunTokenRequest(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const runId = (body as Record<string, unknown>).runId;

  return readRequiredString(runId);
}
