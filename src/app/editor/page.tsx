import { auth } from "@clerk/nextjs/server";
import { EditorClient } from "@/components/editor/editor-client";
import { EditorProvider } from "@/components/editor/editor-context";
import prismaClient from "~/lib/prisma";

export default async function EditorPage() {
  // Server‑side fetch of owned projects using Prisma and Clerk auth
  const { userId } = await auth();
  const ownedProjects = userId
    ? await prismaClient.project.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true },
      })
    : [];
  const sharedProjects: Array<{ id: string; name: string }> = [];

  return (
    <EditorProvider>
      <EditorClient
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
      />
    </EditorProvider>
  );
}
