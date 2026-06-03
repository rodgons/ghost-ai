import { tasks, auth as triggerAuth } from "@trigger.dev/sdk";
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

  const handle = await tasks.trigger<typeof designAgent>("design-agent", {
    prompt: parsed.data.prompt,
    roomId: parsed.data.roomId,
  });

  try {
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: parsed.data.projectId,
        userId: identity.userId,
      },
      select: { id: true },
    });
  } catch (error) {
    if (!isMissingTaskRunTableError(error)) {
      try {
        if (typeof handle.cancel === "function") {
          await handle.cancel();
        }
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
