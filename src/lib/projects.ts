import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../../lib/prisma";

export async function getProjects() {
  const { userId } = await auth();

  if (!userId) {
    return {
      ownedProjects: [],
      sharedProjects: [],
    };
  }

  try {
    // Fetch owned projects
    const ownedProjects = await prisma.project.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch shared projects
    // We need the user's email to query the ProjectCollaborator table
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    let sharedProjects = [] as typeof ownedProjects;
    if (email) {
      const collaborations = await prisma.projectCollaborator.findMany({
        where: {
          email: email,
        },
        include: {
          project: true,
        },
      });
      sharedProjects = collaborations.map((c) => c.project);
    }

    return {
      ownedProjects,
      sharedProjects,
    };
  } catch (error) {
    console.error("[GET_PROJECTS_ERROR]", error);
    return {
      ownedProjects: [],
      sharedProjects: [],
    };
  }
}
