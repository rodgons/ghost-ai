import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../../lib/prisma";

/**
 * Get the current authenticated user's ID and primary email.
 * @returns Object with userId and email, or null if not authenticated
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    return {
      userId,
      email: email || null,
    };
  } catch (error) {
    console.error("[GET_CURRENT_USER_ERROR]", error);
    return null;
  }
}

/**
 * Check if a user has access to a project (as owner or collaborator).
 * @param projectId - The project ID to check
 * @param userId - The user's Clerk ID
 * @param email - The user's primary email
 * @returns True if the user has access, false otherwise
 */
export async function hasProjectAccess(
  projectId: string,
  userId: string | null,
  email: string | null,
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ownerId: true,
        collaborators: email
          ? {
              where: {
                email,
              },
            }
          : undefined,
      },
    });

    if (!project) {
      return false;
    }

    const isOwner = project.ownerId === userId;
    const isCollaborator = email ? project.collaborators.length > 0 : false;

    return isOwner || isCollaborator;
  } catch (error) {
    console.error("[HAS_PROJECT_ACCESS_ERROR]", error);
    return false;
  }
}

/**
 * Get project by ID with access check.
 * @param roomId - The room/project ID
 * @returns Object with project data and hasAccess boolean, or null if project doesn't exist
 */
export async function getProjectWithAccessCheck(roomId: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      project: null,
      hasAccess: false,
      requiresAuth: true,
    };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: roomId },
      include: {
        collaborators: true,
      },
    });

    if (!project) {
      return {
        project: null,
        hasAccess: false,
        requiresAuth: false,
      };
    }

    const hasAccess =
      project.ownerId === currentUser.userId ||
      project.collaborators.some((c) => c.email === currentUser.email);

    return {
      project,
      hasAccess,
      requiresAuth: false,
    };
  } catch (error) {
    console.error("[GET_PROJECT_WITH_ACCESS_CHECK_ERROR]", error);
    return {
      project: null,
      hasAccess: false,
      requiresAuth: false,
    };
  }
}
