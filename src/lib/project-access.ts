import { auth, clerkClient } from "@clerk/nextjs/server";
import prismaClient from "../lib/prisma";

/**
 * Fetch the current Clerk identity: userId and primary email address (if available).
 */
export async function getCurrentClerkIdentity() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  return { userId, email };
}

/**
 * Determine whether the given user (by id and optional email) can access the project.
 */
export async function canAccessProject(
  projectId: string,
  userId: string,
  email: string | null,
) {
  const project = await prismaClient.project.findUnique({
    where: { id: projectId },
    include: { collaborators: true },
  });
  if (!project) return false;
  if (project.ownerId === userId) return true;
  if (email && project.collaborators.some((c) => c.email === email))
    return true;
  return false;
}
