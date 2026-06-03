import { clerkClient } from "@clerk/nextjs/server";
import { getCursorColorForUser } from "@/lib/liveblocks";
import prisma from "@/lib/prisma";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import {
  type AiChatMessagePayload,
  aiChatMessageSchema,
} from "../../../../../../types/tasks";

export const runtime = "nodejs";

interface AiChatRouteContext {
  params: Promise<{ projectId: string }>;
}

async function verifyProjectAccess(projectId: string) {
  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return { status: 401 as const };
  }

  const hasAccess = await canAccessProject(
    projectId,
    identity.userId,
    identity.email,
  );

  if (!hasAccess) {
    return { status: 403 as const };
  }

  return { identity, status: 200 as const };
}

function toChatMessagePayload(message: {
  content: string;
  id: string;
  role: string;
  senderAvatarUrl: string;
  senderCursorColor: string;
  senderDisplayName: string;
  senderId: string;
  sentAt: Date;
}): AiChatMessagePayload {
  return {
    content: message.content,
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    sender: {
      avatarUrl: message.senderAvatarUrl,
      cursorColor: message.senderCursorColor,
      displayName: message.senderDisplayName,
      id: message.senderId,
    },
    timestamp: message.sentAt.getTime(),
  };
}

export async function GET(_request: Request, { params }: AiChatRouteContext) {
  const { projectId } = await params;
  const access = await verifyProjectAccess(projectId);

  if (access.status !== 200) {
    return new Response(null, { status: access.status });
  }

  const messages = await prisma.aiChatMessage.findMany({
    where: { projectId },
    orderBy: { sentAt: "desc" },
    take: 200,
  });
  const chronologicalMessages = messages.reverse();

  return Response.json({
    messages: chronologicalMessages.map(toChatMessagePayload),
  });
}

export async function POST(request: Request, { params }: AiChatRouteContext) {
  const { projectId } = await params;
  const access = await verifyProjectAccess(projectId);

  if (access.status !== 200) {
    return new Response(null, { status: access.status });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = aiChatMessageSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid chat message." }, { status: 400 });
  }

  const message = parsed.data;

  if (message.role !== "user") {
    return new Response(null, { status: 403 });
  }

  const existingMessage = await prisma.aiChatMessage.findUnique({
    where: { id: message.id },
    select: { id: true },
  });

  if (existingMessage) {
    return new Response(null, { status: 409 });
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(access.identity.userId);
  const savedMessage = await prisma.aiChatMessage.create({
    data: {
      content: message.content,
      id: message.id,
      projectId,
      role: "user",
      senderAvatarUrl: clerkUser.imageUrl,
      senderCursorColor: getCursorColorForUser(access.identity.userId),
      senderDisplayName:
        clerkUser.fullName ??
        clerkUser.username ??
        access.identity.email ??
        "User",
      senderId: access.identity.userId,
      sentAt: new Date(),
    },
  });

  return Response.json({
    message: toChatMessagePayload(savedMessage),
  });
}
