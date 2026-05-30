import { clerkClient } from "@clerk/nextjs/server";

export interface CollaboratorDisplay {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

interface StoredCollaborator {
  id: string;
  email: string;
  createdAt: Date;
}

interface ClerkUserSummary {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export function normalizeCollaboratorEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidCollaboratorEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function getDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.username || null;
}

export async function enrichCollaborators(
  collaborators: StoredCollaborator[],
): Promise<CollaboratorDisplay[]> {
  const emails = collaborators.map((collaborator) =>
    normalizeCollaboratorEmail(collaborator.email),
  );
  const clerkUsersByEmail = new Map<string, ClerkUserSummary>();

  if (emails.length > 0) {
    try {
      const client = await clerkClient();
      const MAX_BATCH_SIZE = 500;
      const uniqueEmails = Array.from(new Set(emails));
      const batches: string[][] = [];

      for (let i = 0; i < uniqueEmails.length; i += MAX_BATCH_SIZE) {
        batches.push(uniqueEmails.slice(i, i + MAX_BATCH_SIZE));
      }

      for (const batch of batches) {
        const users = await client.users.getUserList({
          emailAddress: batch,
          limit: batch.length,
        });

        for (const user of users.data) {
          for (const emailAddress of user.emailAddresses) {
            const email = normalizeCollaboratorEmail(
              emailAddress.emailAddress,
            );
            if (!emails.includes(email)) continue;

            clerkUsersByEmail.set(email, {
              email,
              displayName: getDisplayName(user),
              avatarUrl: user.imageUrl || null,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to enrich collaborator users:", error);
    }
  }

  return collaborators.map((collaborator) => {
    const enriched = clerkUsersByEmail.get(
      normalizeCollaboratorEmail(collaborator.email),
    );

    return {
      id: collaborator.id,
      email: collaborator.email,
      displayName: enriched?.displayName ?? null,
      avatarUrl: enriched?.avatarUrl ?? null,
      createdAt: collaborator.createdAt.toISOString(),
    };
  });
}
