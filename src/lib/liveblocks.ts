import { Liveblocks as LiveblocksClient } from "@liveblocks/node";

const CURSOR_COLORS = [
  "#00C8D4",
  "#6457F9",
  "#34D399",
  "#FBBF24",
  "#FF6166",
  "#F75F8F",
  "#52A8FF",
  "#BF7AF0",
] as const;

declare global {
  var liveblocksClient: LiveblocksClient | undefined;
}

function createLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is required.");
  }

  return new LiveblocksClient({ secret });
}

export function getLiveblocksClient() {
  if (process.env.NODE_ENV === "development") {
    if (!global.liveblocksClient) {
      global.liveblocksClient = createLiveblocksClient();
    }

    return global.liveblocksClient;
  }

  return createLiveblocksClient();
}

export function getCursorColorForUser(userId: string) {
  let hash = 0;

  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }

  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}
