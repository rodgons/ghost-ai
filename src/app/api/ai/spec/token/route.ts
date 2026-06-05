import { auth } from "@trigger.dev/sdk";
import { parseSpecRunTokenRequest } from "@/lib/ai/spec-generation";
import prisma from "@/lib/prisma";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = parseSpecRunTokenRequest(body);

  if (!parsed.success) {
    return Response.json({ error: "Run ID is required." }, { status: 400 });
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return new Response(null, { status: 401 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId: parsed.data.runId },
    select: { userId: true, projectId: true },
  });

  if (!taskRun) {
    return new Response(null, { status: 404 });
  }

  if (taskRun.userId !== identity.userId) {
    return new Response(null, { status: 403 });
  }

  const hasAccess = await canAccessProject(
    taskRun.projectId,
    identity.userId,
    identity.email,
  );

  if (!hasAccess) {
    return new Response(null, { status: 403 });
  }

  const token = await auth.createPublicToken({
    scopes: {
      read: {
        runs: parsed.data.runId,
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token });
}
