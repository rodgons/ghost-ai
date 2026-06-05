import { randomUUID } from "node:crypto";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  AbortTaskRunError,
  logger,
  metadata,
  schemaTask,
} from "@trigger.dev/sdk";
import { del, put } from "@vercel/blob";
import { generateText } from "ai";
import {
  type SpecGenerationTaskPayload,
  specGenerationTaskPayloadSchema,
} from "../lib/ai/spec-generation";
import prisma from "../lib/prisma";

const DEFAULT_SPEC_GENERATION_MODEL = "gemini-2.5-flash-lite";
const GEMINI_TIMEOUT_MS = 90_000;

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error.";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutInMs: number,
  operation: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutInMs}ms.`));
    }, timeoutInMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function getSpecPrompt(payload: SpecGenerationTaskPayload) {
  return [
    "You are Ghost AI, a senior software architect writing a technical specification.",
    "Generate a plain Markdown technical spec from the current collaborative canvas and chat context.",
    "Do not wrap the output in code fences. Do not include implementation status, Trigger.dev details, or private identifiers unless they are part of the architecture context.",
    "Use clear sections for overview, goals, architecture, components, data flow, APIs or interfaces, storage, operational concerns, risks, and open questions when applicable.",
    "Ground the spec in the supplied nodes, edges, and conversation. If information is missing, call it out as an open question instead of inventing product requirements.",
    "Project context:",
    JSON.stringify({ projectId: payload.projectId, roomId: payload.roomId }),
    "Chat history:",
    JSON.stringify(payload.chatHistory),
    "Canvas nodes:",
    JSON.stringify(payload.nodes),
    "Canvas edges:",
    JSON.stringify(payload.edges),
  ].join("\n");
}

async function generateMarkdownSpec(payload: SpecGenerationTaskPayload) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required.");
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const modelName =
    process.env.SPEC_GENERATION_MODEL?.trim() || DEFAULT_SPEC_GENERATION_MODEL;
  const model = google(modelName);

  logger.info("Gemini spec generation started.", { model: modelName });

  const result = await withTimeout(
    generateText({
      maxOutputTokens: 5_000,
      maxRetries: 0,
      model,
      prompt: getSpecPrompt(payload),
      temperature: 0.2,
    }),
    GEMINI_TIMEOUT_MS,
    "Gemini spec generation",
  );

  logger.info("Gemini spec generation completed.");

  return result.text.trim();
}

async function persistMarkdownSpec(projectId: string, markdown: string) {
  const specId = randomUUID();
  const savePath = `specs/${projectId}/${specId}.md`;
  let savedBlob: Awaited<ReturnType<typeof put>> | undefined;

  try {
    savedBlob = await put(savePath, markdown, {
      access: "private",
      contentType: "text/markdown; charset=utf-8",
    });

    const spec = await prisma.projectSpec.create({
      data: {
        filePath: savedBlob.url,
        id: specId,
        projectId,
      },
      select: { filePath: true, id: true },
    });

    return spec;
  } catch (error) {
    if (savedBlob) {
      try {
        await del(savePath);
      } catch (cleanupError) {
        logger.warn("Failed to remove orphan spec blob.", {
          error: describeError(cleanupError),
          path: savePath,
        });
      }
    }

    throw error;
  }
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  maxDuration: 180,
  retry: {
    maxAttempts: 1,
  },
  schema: specGenerationTaskPayloadSchema,
  run: async (payload) => {
    logger.info("Spec generation task started.", {
      edgeCount: payload.edges.length,
      messageCount: payload.chatHistory.length,
      nodeCount: payload.nodes.length,
      projectId: payload.projectId,
      roomId: payload.roomId,
    });

    metadata
      .set("scope", "spec")
      .set("status", "working")
      .set("message", "Ghost AI is drafting the technical spec.");

    try {
      const markdown = await generateMarkdownSpec(payload);
      const spec = await persistMarkdownSpec(payload.projectId, markdown);

      metadata
        .set("status", "success")
        .set("message", "Ghost AI finished the technical spec.")
        .set("specId", spec.id)
        .set("filePath", spec.filePath);

      logger.info("Spec generation task completed.", {
        filePath: spec.filePath,
        outputLength: markdown.length,
        projectId: payload.projectId,
        roomId: payload.roomId,
        specId: spec.id,
      });

      return markdown;
    } catch (error) {
      const message = describeError(error);

      metadata
        .set("status", "error")
        .set("message", "Ghost AI could not generate the technical spec.");

      logger.error("Spec generation task failed.", {
        error: message,
        projectId: payload.projectId,
        roomId: payload.roomId,
      });

      throw new AbortTaskRunError(message);
    }
  },
});
