import { auth } from "@trigger.dev/sdk";
import { parseDesignRunTokenRequest } from "@/lib/ai/design-agent";
import prisma from "@/lib/prisma";
import { getCurrentClerkIdentity } from "@/lib/project-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const runId = parseDesignRunTokenRequest(body);

  if (!runId) {
    return Response.json({ error: "Run ID is required." }, { status: 400 });
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return new Response(null, { status: 401 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
    select: {
      userId: true,
    },
  });

  if (!taskRun) {
    return new Response(null, { status: 404 });
  }

  if (taskRun.userId !== identity.userId) {
    return new Response(null, { status: 403 });
  }

  const token = await auth.createPublicToken({
    scopes: {
      read: {
        runs: runId,
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token });
}
