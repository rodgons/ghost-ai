import { auth, clerkClient } from "@clerk/nextjs/server";
import { getCursorColorForUser, getLiveblocksClient } from "@/lib/liveblocks";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";

export const runtime = "nodejs";

interface LiveblocksAuthRequestBody {
  room?: unknown;
  roomId?: unknown;
}

function getDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return (
    fullName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    "Ghost AI user"
  );
}

async function parseRoomId(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as LiveblocksAuthRequestBody | null;
  const roomId = body?.roomId ?? body?.room;

  return typeof roomId === "string" && roomId.trim() ? roomId.trim() : null;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response(null, { status: 401 });
  }

  const roomId = await parseRoomId(request);

  if (!roomId) {
    return Response.json({ error: "Room ID is required." }, { status: 400 });
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return new Response(null, { status: 401 });
  }

  const hasProjectAccess = await canAccessProject(
    roomId,
    identity.userId,
    identity.email,
  );

  if (!hasProjectAccess) {
    return new Response(null, { status: 403 });
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const liveblocks = getLiveblocksClient();

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
    metadata: {
      projectId: roomId,
      roomType: "project",
    },
  });

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      displayName: getDisplayName(user),
      avatarUrl: user.imageUrl || "",
      cursorColor: getCursorColorForUser(userId),
    },
  });

  session.allow(roomId, session.FULL_ACCESS);

  const { status, body } = await session.authorize();

  return new Response(body, { status });
}
