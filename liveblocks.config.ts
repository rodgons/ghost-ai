import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasEdge, CanvasNode } from "./types/canvas";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { flowX: number; flowY: number } | null;
      thinking: boolean;
    };

    Storage: {
      flow?: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };

    UserMeta: {
      id: string;
      info: {
        displayName: string;
        avatarUrl: string;
        cursorColor: string;
      };
    };

    RoomEvent:
      | {
          type: "ai-chat";
          payload: {
            content: string;
            id: string;
            role: "assistant" | "user";
            sender: {
              avatarUrl: string;
              cursorColor: string;
              displayName: string;
              id: string;
            };
            timestamp: number;
          };
        }
      | {
          type: "ai-status-feed";
          payload: {
            createdAt: number;
            id: string;
            scope: "design" | "spec";
            state: "error" | "idle" | "success" | "working";
            text?: string;
          };
        }
      | {
          type: "design-agent-status";
          id: string;
          level: "info" | "success" | "error";
          message: string;
          createdAt: number;
        };
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
    GroupInfo: Record<string, never>;
    ActivitiesData: Record<string, never>;
  }
}
