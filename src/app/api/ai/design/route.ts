import { createHash, randomUUID } from "node:crypto";
import { runs, tasks, auth as triggerAuth } from "@trigger.dev/sdk";
import { Prisma } from "@/generated/prisma/client";
import { parseDesignAgentRequest } from "@/lib/ai/design-agent";
import prisma from "@/lib/prisma";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import type { designAgent } from "@/trigger/design-agent";

export const runtime = "nodejs";

function isMissingTaskRunTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2021"
  );
}

function isUniqueConstraintError(error: unknown, field: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes(field)
  );
}

function getDesignRunIdempotencyKey({
  projectId,
  prompt,
  roomId,
  userId,
}: {
  projectId: string;
  prompt: string;
  roomId: string;
  userId: string;
}) {
  return createHash("sha256")
    .update(userId)
    .update("\0")
    .update(projectId)
    .update("\0")
    .update(roomId)
    .update("\0")
    .update(prompt)
    .digest("hex");
}

async function verifyTaskRunStorage() {
  try {
    await prisma.taskRun.count();
  } catch (error) {
    if (isMissingTaskRunTableError(error)) {
      return Response.json(
        {
          error:
            "Task run storage is not ready. Run `pnpm prisma migrate dev` before starting a design run.",
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
  const parsed = parseDesignAgentRequest(body);

  if (!parsed.data) {
    return Response.json(
      { error: parsed.error ?? "Invalid request body." },
      { status: 400 },
    );
  }

  if (parsed.data.roomId !== parsed.data.projectId) {
    return Response.json(
      { error: "Room ID must match Project ID." },
      { status: 400 },
    );
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return new Response(null, { status: 401 });
  }

  const hasAccess = await canAccessProject(
    parsed.data.projectId,
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

  const idempotencyKey = getDesignRunIdempotencyKey({
    projectId: parsed.data.projectId,
    prompt: parsed.data.prompt,
    roomId: parsed.data.roomId,
    userId: identity.userId,
  });
  let pendingRun: { id: string; runId: string; idempotencyKey: string };

  try {
    pendingRun = await prisma.taskRun.create({
      data: {
        idempotencyKey,
        runId: randomUUID(),
        projectId: parsed.data.projectId,
        userId: identity.userId,
      },
      select: { id: true, idempotencyKey: true, runId: true },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error, "idempotencyKey")) {
      throw error;
    }

    const existingRun = await prisma.taskRun.findUnique({
      where: { idempotencyKey },
      select: { runId: true },
    });

    if (existingRun?.runId.startsWith("run_")) {
      const publicToken = await triggerAuth.createPublicToken({
        scopes: {
          read: {
            runs: existingRun.runId,
          },
        },
        expirationTime: "1h",
      });

      return Response.json(
        { publicToken, runId: existingRun.runId },
        { status: 202 },
      );
    }

    return Response.json(
      { error: "Design run is already being started." },
      { status: 409 },
    );
  }

  let handle: Awaited<ReturnType<typeof tasks.trigger<typeof designAgent>>>;

  try {
    handle = await tasks.trigger<typeof designAgent>(
      "design-agent",
      {
        prompt: parsed.data.prompt,
        roomId: parsed.data.roomId,
      },
      {
        idempotencyKey: pendingRun.idempotencyKey,
      },
    );
  } catch (error) {
    await prisma.taskRun.delete({ where: { id: pendingRun.id } }).catch(() => {
      // Ignore cleanup failures; original error should surface.
    });

    throw error;
  }

  try {
    await prisma.taskRun.update({
      where: { id: pendingRun.id },
      data: { runId: handle.id },
      select: { id: true },
    });
  } catch (error) {
    if (!isMissingTaskRunTableError(error)) {
      try {
        await runs.cancel(handle.id);
      } catch {
        // Ignore cleanup failures; original error should surface.
      }
    }

    throw error;
  }

  const publicToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: handle.id,
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ publicToken, runId: handle.id }, { status: 202 });
}
