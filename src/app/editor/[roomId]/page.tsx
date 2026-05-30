import { notFound, redirect } from "next/navigation";
import AccessDenied from "@/components/editor/access-denied";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";
import prismaClient from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditorRoomPage({
  params,
}: {
  params: Promise<{ roomId?: string | string[] }>;
}) {
  const { roomId: rawRoomId } = await params;
  const roomId =
    typeof rawRoomId === "string"
      ? rawRoomId
      : Array.isArray(rawRoomId)
        ? rawRoomId[0]
        : undefined;

  if (!roomId) {
    notFound();
  }

  const identity = await getCurrentClerkIdentity();
  if (!identity) {
    redirect("/sign-in");
  }
  const { userId, email } = identity;

  // Verify project existence and access rights
  const project = await prismaClient.project.findUnique({
    where: { id: roomId },
    select: { id: true, name: true },
  });
  if (!project) {
    return <AccessDenied />;
  }
  const hasAccess = await canAccessProject(roomId, userId, email);
  if (!hasAccess) {
    return <AccessDenied />;
  }

  // Fetch sidebar data
  const ownedProjects = await prismaClient.project.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true },
  });
  const sharedProjects = email
    ? await prismaClient.project.findMany({
        where: { collaborators: { some: { email } } },
        select: { id: true, name: true },
      })
    : [];

  return (
    <EditorWorkspace
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      projectId={project.id}
      projectName={project.name}
    />
  );
}
