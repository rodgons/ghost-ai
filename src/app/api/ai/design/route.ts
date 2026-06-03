import { runs, tasks, auth as triggerAuth } from "@trigger.dev/sdk";
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

  const pendingRun = await prisma.taskRun.create({
    data: {
      runId: crypto.randomUUID(),
      projectId: parsed.data.projectId,
      userId: identity.userId,
    },
    select: { id: true, runId: true },
  });

  let handle: Awaited<ReturnType<typeof tasks.trigger<typeof designAgent>>>;

  try {
    handle = await tasks.trigger<typeof designAgent>(
      "design-agent",
      {
        prompt: parsed.data.prompt,
        roomId: parsed.data.roomId,
      },
      {
        idempotencyKey: pendingRun.runId,
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
