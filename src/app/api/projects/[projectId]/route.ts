import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

/**
 * Update a project's name if the authenticated user is the project owner.
 *
 * Validates authentication, ownership, and request body; updates the project's
 * `name` when provided and returns the updated project.
 *
 * @param params - A promise resolving to an object containing `projectId`.
 * @returns The HTTP response:
 * - On success: JSON of the updated project with status 200.
 * - 400 when the request body is invalid or malformed.
 * - 401 when the requester is unauthenticated.
 * - 403 when the project does not exist or the requester is not the owner.
 * - 500 for unexpected server errors.
 */
export async function PATCH(
  req: Request,
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
    });

    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: { name?: string };
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

    if (body.name !== undefined && typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Project name must be a string" },
        { status: 400 },
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error("[PROJECT_ITEM_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Deletes the project identified by `projectId` if the authenticated user is the owner.
 *
 * @param params - A promise resolving to an object containing the `projectId` route parameter.
 * @returns A NextResponse: status 204 on successful deletion; JSON error responses with statuses 401, 403, or 500 otherwise.
 */
export async function DELETE(
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
    });

    if (!project || project.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_ITEM_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
