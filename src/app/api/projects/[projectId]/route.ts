import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../../lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(null, { status: 401 });
  }
  const { projectId } = await params;
  const body = await request.json();
  const name = body?.name?.trim();
  if (!name) {
    return new Response(JSON.stringify({ error: "Name required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Verify ownership
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!existing) {
    return new Response(null, { status: 404 });
  }
  if (existing.ownerId !== userId) {
    return new Response(null, { status: 403 });
  }
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(null, { status: 401 });
  }
  const { projectId } = await params;
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!existing) {
    return new Response(null, { status: 404 });
  }
  if (existing.ownerId !== userId) {
    return new Response(null, { status: 403 });
  }
  await prisma.project.delete({ where: { id: projectId } });
  return new Response(null, { status: 204 });
}
