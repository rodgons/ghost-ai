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

  return { status: 200 as const };
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
    orderBy: { sentAt: "asc" },
    take: 200,
  });

  return Response.json({
    messages: messages.map(toChatMessagePayload),
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
  const existingMessage = await prisma.aiChatMessage.findUnique({
    where: { id: message.id },
    select: { projectId: true },
  });

  if (existingMessage && existingMessage.projectId !== projectId) {
    return new Response(null, { status: 409 });
  }

  const savedMessage = await prisma.aiChatMessage.upsert({
    where: { id: message.id },
    create: {
      content: message.content,
      id: message.id,
      projectId,
      role: message.role,
      senderAvatarUrl: message.sender.avatarUrl,
      senderCursorColor: message.sender.cursorColor,
      senderDisplayName: message.sender.displayName,
      senderId: message.sender.id,
      sentAt: new Date(message.timestamp),
    },
    update: {
      content: message.content,
      role: message.role,
      senderAvatarUrl: message.sender.avatarUrl,
      senderCursorColor: message.sender.cursorColor,
      senderDisplayName: message.sender.displayName,
      senderId: message.sender.id,
      sentAt: new Date(message.timestamp),
    },
  });

  return Response.json({
    message: toChatMessagePayload(savedMessage),
  });
}
