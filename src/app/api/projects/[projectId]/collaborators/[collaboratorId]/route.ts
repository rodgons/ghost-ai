import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ projectId: string; collaboratorId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(null, { status: 401 });
  }

  const { projectId, collaboratorId } = await params;
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

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { id: collaboratorId },
    select: { projectId: true },
  });

  if (!collaborator || collaborator.projectId !== projectId) {
    return new Response(null, { status: 404 });
  }

  await prisma.projectCollaborator.delete({
    where: { id: collaboratorId },
  });

  return new Response(null, { status: 204 });
}
