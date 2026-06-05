import { randomUUID } from "node:crypto";
import { runs, tasks } from "@trigger.dev/sdk";
import { Prisma } from "@/generated/prisma/client";
import { parseSpecGenerationRequest } from "@/lib/ai/spec-generation";
import prisma from "@/lib/prisma";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import type { generateSpec } from "@/trigger/generate-spec";

export const runtime = "nodejs";

function isMissingTaskRunTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2021"
  );
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function verifyTaskRunStorage() {
  try {
    await prisma.taskRun.count();
  } catch (error) {
    if (isMissingTaskRunTableError(error)) {
      return Response.json(
        {
          error:
            "Task run storage is not ready. Run `pnpm prisma migrate dev` before starting a spec run.",
        },
        { status: 500 },
      );
    }

    throw error;
  }

  return null;
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = parseSpecGenerationRequest(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return new Response(null, { status: 401 });
  }

  const projectId = parsed.data.roomId;
  const hasAccess = await canAccessProject(
    projectId,
    identity.userId,
    identity.email,
  );

  if (!hasAccess) {
    return new Response(null, { status: 403 });
  }

  const storageError = await verifyTaskRunStorage();

  if (storageError) {
    return storageError;
  }

  const idempotencyKey = `spec:${randomUUID()}`;
  const handle = await tasks.trigger<typeof generateSpec>(
    "generate-spec",
    {
      chatHistory: parsed.data.chatHistory,
      edges: parsed.data.edges,
      nodes: parsed.data.nodes,
      projectId,
      roomId: parsed.data.roomId,
    },
    { idempotencyKey },
  );

  try {
    await prisma.taskRun.create({
      data: {
        idempotencyKey,
        projectId,
        runId: handle.id,
        userId: identity.userId,
      },
      select: { id: true },
    });
  } catch (error) {
    if (!isMissingTaskRunTableError(error) && !isUniqueConstraintError(error)) {
      try {
        await runs.cancel(handle.id);
      } catch {
        // Ignore cleanup failures; original persistence error should surface.
      }
    }

    throw error;
  }

  return Response.json({ runId: handle.id }, { status: 202 });
}
