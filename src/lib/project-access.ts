import { auth, clerkClient } from "@clerk/nextjs/server";
import { normalizeCollaboratorEmail } from "@/lib/collaborators";
import prismaClient from "../lib/prisma";

/**
 * Fetch the current Clerk identity: userId and primary email address (if available).
 */
export async function getCurrentClerkIdentity() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  let email: string | null = null;
  try {
    const clerkUser = await client.users.getUser(userId);
    const rawEmail = clerkUser?.primaryEmailAddress?.emailAddress;
    email = rawEmail ? rawEmail.trim().toLowerCase() : null;
  } catch {
    email = null;
  }
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
<<<<<<< HEAD
  if (
    email &&
    project.collaborators.some(
      (c) => c.email.toLowerCase().trim() === email.toLowerCase().trim(),
=======
  const normalizedEmail = email ? normalizeCollaboratorEmail(email) : null;
  if (
    normalizedEmail &&
    project.collaborators.some(
      (collaborator) =>
        normalizeCollaboratorEmail(collaborator.email) === normalizedEmail,
>>>>>>> ee2c27f (Add project sharing dialog)
    )
  )
    return true;
  return false;
}
