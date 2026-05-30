import { auth } from "@clerk/nextjs/server";
import {
  enrichCollaborators,
  errorResponse,
  isValidCollaboratorEmail,
  normalizeCollaboratorEmail,
} from "@/lib/collaborators";
import prisma from "@/lib/prisma";
import { getCurrentClerkIdentity } from "@/lib/project-access";

interface CollaboratorRequestBody {
  email?: unknown;
}

function parseEmail(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const { email } = body as CollaboratorRequestBody;
  return typeof email === "string" ? normalizeCollaboratorEmail(email) : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getCurrentClerkIdentity();
  if (!identity) {
    return new Response(null, { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      collaborators: {
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, createdAt: true },
      },
    },
  });

  if (!project) {
    return new Response(null, { status: 404 });
  }

  const isOwner = project.ownerId === identity.userId;
  const normalizedEmail = identity.email
    ? normalizeCollaboratorEmail(identity.email)
    : null;
  const isCollaborator =
    normalizedEmail !== null &&
    project.collaborators.some(
      (collaborator) =>
        normalizeCollaboratorEmail(collaborator.email) === normalizedEmail,
    );

  if (!isOwner && !isCollaborator) {
    return new Response(null, { status: 403 });
  }

  const collaborators = await enrichCollaborators(project.collaborators);

  return Response.json({
    collaborators,
    canManage: isOwner,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(null, { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return new Response(null, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return new Response(null, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const email = parseEmail(body);

  if (!email || !isValidCollaboratorEmail(email)) {
    return errorResponse("A valid collaborator email is required.", 400);
  }

  const collaborator = await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    create: { projectId, email },
    update: {},
    select: { id: true, email: true, createdAt: true },
  });

  const [enrichedCollaborator] = await enrichCollaborators([collaborator]);

  return Response.json({ collaborator: enrichedCollaborator }, { status: 201 });
}
