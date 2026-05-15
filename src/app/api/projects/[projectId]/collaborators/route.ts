import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

function sanitizeError(error: unknown): { message: string; stack?: string } {
  const message = error instanceof Error ? error.message : String(error);
  const redacted = message.replace(/email[^\s]*/gi, "[REDACTED]");
  if (error instanceof Error) {
    return { message: redacted, stack: error.stack };
  }
  return { message: redacted };
}

/**
 * GET /api/projects/[projectId]/collaborators
 * List all collaborators for a project with enriched Clerk data
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        collaborators: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      const currentUserEmail = await getCurrentUserEmail(userId);
      const isCollaborator = project.collaborators.some(
        (c) => c.email === currentUserEmail,
      );
      if (!isCollaborator) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const client = await clerkClient();
    const owner = await client.users.getUser(project.ownerId);
    const ownerEmail = owner.emailAddresses[0]?.emailAddress;

    const collaborators = [
      {
        id: `${project.ownerId}-owner`,
        email: ownerEmail || project.ownerId,
        displayName:
          owner.firstName && owner.lastName
            ? `${owner.firstName} ${owner.lastName}`
            : owner.username || ownerEmail || undefined,
        avatarUrl: owner.imageUrl,
        isOwner: true,
      },
      ...project.collaborators.map((c) => ({
        id: c.id,
        email: c.email,
        displayName: undefined,
        avatarUrl: undefined,
        isOwner: false,
      })),
    ];

    const nonOwnerEmails = collaborators
      .filter((c) => !c.isOwner)
      .map((c) => c.email);

    const clerkUsersResponse = await client.users.getUserList({
      emailAddress: nonOwnerEmails,
    });

    const userLookup = new Map(
      clerkUsersResponse.data.map((u) => [
        u.emailAddresses[0]?.emailAddress || "",
        u,
      ]),
    );

    const enrichedCollaborators = collaborators.map((c) => {
      if (c.isOwner) {
        return c;
      }

      const clerkUser = userLookup.get(c.email);
      if (clerkUser) {
        return {
          ...c,
          displayName:
            clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.username || c.email,
          avatarUrl: clerkUser.imageUrl,
        };
      }

      return c;
    });

    return NextResponse.json({ collaborators: enrichedCollaborators });
  } catch (error) {
    const sanitized = sanitizeError(error);
    console.error("[COLLABORATORS_GET]", sanitized.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects/[projectId]/collaborators
 * Add a collaborator to a project (owner only)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be an object" },
      { status: 400 },
    );
  }

  if (!body.email || typeof body.email !== "string") {
    return NextResponse.json(
      { error: "Email is required and must be a string" },
      { status: 400 },
    );
  }

  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const email = body.email.trim().toLowerCase();

    const existingCollaborator = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId,
          email,
        },
      },
    });

    if (existingCollaborator) {
      return NextResponse.json(
        { error: "User is already a collaborator" },
        { status: 400 },
      );
    }

    const currentEmail = await getCurrentUserEmail(userId);
    if (!currentEmail) {
      return NextResponse.json(
        { error: "Unable to verify current user email" },
        { status: 500 },
      );
    }

    if (email === currentEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Cannot invite yourself" },
        { status: 400 },
      );
    }

    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId,
        email,
      },
    });

    return NextResponse.json({
      id: collaborator.id,
      email: collaborator.email,
    });
  } catch (error) {
    const sanitized = sanitizeError(error);
    console.error("[COLLABORATORS_POST]", sanitized.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/projects/[projectId]/collaborators?email=<email>
 * Remove a collaborator from a project (owner only)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId } = await params;
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const collaborator = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId,
          email: email.trim().toLowerCase(),
        },
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: "Collaborator not found" },
        { status: 404 },
      );
    }

    await prisma.projectCollaborator.delete({
      where: {
        projectId_email: {
          projectId,
          email: email.trim().toLowerCase(),
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const sanitized = sanitizeError(error);
    console.error("[COLLABORATORS_DELETE]", sanitized.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

async function getCurrentUserEmail(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.emailAddresses[0]?.emailAddress || null;
  } catch {
    return null;
  }
}
