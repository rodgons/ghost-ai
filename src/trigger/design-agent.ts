import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";
import { MarkerType } from "@xyflow/react";
import { generateObject, jsonSchema } from "ai";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
  NODE_COLORS,
  NODE_SHAPES,
  type NodeShape,
} from "../../types/canvas";
import { AI_STATUS_FEED_NAME, type AiStatusFeedState } from "../../types/tasks";
import { getCursorColorForUser, getLiveblocksClient } from "../lib/liveblocks";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

type StatusLevel = "error" | "info" | "success";

type DesignAgentAction =
  | {
      colorIndex: number;
      height: number;
      id: string;
      label: string;
      shape: NodeShape;
      type: "addNode";
      width: number;
      x: number;
      y: number;
    }
  | {
      id: string;
      type: "moveNode";
      x: number;
      y: number;
    }
  | {
      height: number;
      id: string;
      type: "resizeNode";
      width: number;
    }
  | {
      colorIndex?: number;
      id: string;
      label?: string;
      shape?: NodeShape;
      type: "updateNodeData";
    }
  | {
      id: string;
      type: "deleteNode";
    }
  | {
      id: string;
      label?: string;
      source: string;
      sourceHandle?: string;
      target: string;
      targetHandle?: string;
      type: "addEdge";
    }
  | {
      id: string;
      type: "deleteEdge";
    };

interface RawDesignAgentAction {
  colorIndex?: number;
  height?: number;
  id?: string;
  label?: string;
  shape?: NodeShape;
  source?: string;
  sourceHandle?: string;
  target?: string;
  targetHandle?: string;
  type:
    | "addNode"
    | "moveNode"
    | "resizeNode"
    | "updateNodeData"
    | "deleteNode"
    | "addEdge"
    | "deleteEdge";
  width?: number;
  x?: number;
  y?: number;
}

interface DesignAgentPlan {
  actions: RawDesignAgentAction[];
  summary: string;
}

interface CanvasSnapshotForModel {
  edges: Array<{
    id: string;
    label: string;
    source: string;
    target: string;
  }>;
  nodes: Array<{
    colorIndex: number;
    height: number;
    id: string;
    label: string;
    shape: NodeShape;
    width: number;
    x: number;
    y: number;
  }>;
}

interface NodeLayout {
  height: number;
  width: number;
  x: number;
  y: number;
}

type ConnectionHandleId = "bottom" | "left" | "right" | "top";

const AI_USER_ID = "ai:design-agent";
const AI_USER_INFO = {
  avatarUrl: "",
  cursorColor: getCursorColorForUser(AI_USER_ID),
  displayName: "Ghost AI",
};
const DEFAULT_EDGE_COLOR = "var(--foreground)";
const MIN_NODE_HEIGHT = 64;
const MIN_NODE_WIDTH = 96;
const MAX_ACTIONS = 40;
const DEFAULT_CURSOR = { flowX: 80, flowY: 80 };
const LIVEBLOCKS_TIMEOUT_MS = 15_000;
const GEMINI_TIMEOUT_MS = 90_000;
const DEFAULT_DESIGN_AGENT_MODEL = "gemini-2.5-flash-lite";

const designPlanSchema = jsonSchema<DesignAgentPlan>({
  additionalProperties: false,
  properties: {
    actions: {
      items: {
        additionalProperties: false,
        properties: {
          colorIndex: {
            maximum: NODE_COLORS.length - 1,
            minimum: 0,
            type: "integer",
          },
          height: { minimum: MIN_NODE_HEIGHT, type: "number" },
          id: { minLength: 1, type: "string" },
          label: { type: "string" },
          shape: { enum: [...NODE_SHAPES], type: "string" },
          source: { minLength: 1, type: "string" },
          sourceHandle: { type: "string" },
          target: { minLength: 1, type: "string" },
          targetHandle: { type: "string" },
          type: {
            enum: [
              "addNode",
              "moveNode",
              "resizeNode",
              "updateNodeData",
              "deleteNode",
              "addEdge",
              "deleteEdge",
            ],
            type: "string",
          },
          width: { minimum: MIN_NODE_WIDTH, type: "number" },
          x: { type: "number" },
          y: { type: "number" },
        },
        required: ["type"],
        type: "object",
      },
      maxItems: MAX_ACTIONS,
      type: "array",
    },
    summary: { minLength: 1, type: "string" },
  },
  required: ["summary", "actions"],
  type: "object",
});

function isNodeShape(value: string): value is NodeShape {
  return NODE_SHAPES.includes(value as NodeShape);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getNodeDimension(value: unknown, minimum: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(value, minimum)
    : fallback;
}

function getNodePosition(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getCenter(layout: NodeLayout) {
  return {
    x: layout.x + layout.width / 2,
    y: layout.y + layout.height / 2,
  };
}

function getDirectionalConnectionHandles(
  source: NodeLayout,
  target: NodeLayout,
): { sourceHandle: ConnectionHandleId; targetHandle: ConnectionHandleId } {
  const sourceCenter = getCenter(source);
  const targetCenter = getCenter(target);
  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" };
  }

  return deltaY >= 0
    ? { sourceHandle: "bottom", targetHandle: "top" }
    : { sourceHandle: "top", targetHandle: "bottom" };
}

function getSemanticColorIndex(label: string, shape: NodeShape) {
  const normalizedLabel = label.toLowerCase();

  if (
    shape === "cylinder" ||
    /\b(db|database|postgres|sql|history|store|storage|s3|bucket|cache|redis)\b/.test(
      normalizedLabel,
    )
  ) {
    return 6;
  }

  if (
    shape === "hexagon" ||
    /\b(pubsub|pub\/sub|queue|broker|redis|event|stream|cloud|infra|platform)\b/.test(
      normalizedLabel,
    )
  ) {
    return 7;
  }

  if (
    shape === "diamond" ||
    /\b(gateway|router|load balancer|balancer|decision|fanout|fan-out)\b/.test(
      normalizedLabel,
    )
  ) {
    return 3;
  }

  if (
    shape === "circle" ||
    /\b(user|client|browser|mobile|external|admin|operator)\b/.test(
      normalizedLabel,
    )
  ) {
    return 1;
  }

  if (
    shape === "pill" ||
    /\b(api|workflow|process|websocket|socket|presence|service)\b/.test(
      normalizedLabel,
    )
  ) {
    return 2;
  }

  return 1;
}

function getMeaningfulEdgeLabel(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const label = value.trim().replace(/\s+/g, " ").slice(0, 80);

  if (!label) {
    return undefined;
  }

  const normalizedLabel = label.toLowerCase();
  const genericLabels = new Set([
    "connect",
    "connects",
    "connected",
    "connection",
    "link",
    "links",
    "linked",
    "arrow",
    "flow",
    "data",
    "message",
    "request",
    "response",
  ]);

  return genericLabels.has(normalizedLabel) ? undefined : label;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error.";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutInMs: number,
  operation: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutInMs}ms.`));
    }, timeoutInMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function runLiveblocksOperation<T>(
  operation: string,
  promise: Promise<T>,
) {
  logger.info(`${operation} started.`);

  try {
    const result = await withTimeout(promise, LIVEBLOCKS_TIMEOUT_MS, operation);
    logger.info(`${operation} completed.`);
    return result;
  } catch (error) {
    logger.error(`${operation} failed.`, {
      error: describeError(error),
    });
    throw error;
  }
}

async function runBestEffortLiveblocksOperation<T>(
  operation: string,
  promise: Promise<T>,
) {
  try {
    await runLiveblocksOperation(operation, promise);
  } catch (error) {
    logger.warn(`${operation} skipped.`, {
      error: describeError(error),
    });
  }
}

function getNodeColorIndex(color: CanvasNode["data"]["color"]) {
  const index = NODE_COLORS.findIndex(
    (candidate) =>
      candidate.fill === color.fill && candidate.text === color.text,
  );

  return index >= 0 ? index : 0;
}

function getNodeWidth(node: CanvasNode) {
  return getNodeDimension(node.style?.width, MIN_NODE_WIDTH, 180);
}

function getNodeHeight(node: CanvasNode) {
  return getNodeDimension(node.style?.height, MIN_NODE_HEIGHT, 88);
}

function getSnapshotForModel(nodes: CanvasNode[], edges: CanvasEdge[]) {
  return {
    edges: edges.map((edge) => ({
      id: edge.id,
      label: edge.data?.label ?? "",
      source: edge.source,
      target: edge.target,
    })),
    nodes: nodes.map((node) => ({
      colorIndex: getNodeColorIndex(node.data.color),
      height: getNodeHeight(node),
      id: node.id,
      label: node.data.label,
      shape: node.data.shape,
      width: getNodeWidth(node),
      x: node.position.x,
      y: node.position.y,
    })),
  } satisfies CanvasSnapshotForModel;
}

function getUniqueId(
  requestedId: string | undefined,
  existingIds: Set<string>,
  prefix: string,
) {
  const sanitizedId = (requestedId ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 64);
  const baseId =
    sanitizedId.length > 0 ? sanitizedId : `${prefix}-${crypto.randomUUID()}`;

  if (!existingIds.has(baseId)) {
    existingIds.add(baseId);
    return baseId;
  }

  for (let index = 1; index < 100; index += 1) {
    const candidate = `${baseId}-${index}`;

    if (!existingIds.has(candidate)) {
      existingIds.add(candidate);
      return candidate;
    }
  }

  const fallbackId = `${prefix}-${crypto.randomUUID()}`;
  existingIds.add(fallbackId);
  return fallbackId;
}

function sanitizeActions(
  plan: DesignAgentPlan,
  snapshot: CanvasSnapshotForModel,
) {
  const existingNodeIds = new Set(snapshot.nodes.map((node) => node.id));
  const existingEdgeIds = new Set(snapshot.edges.map((edge) => edge.id));
  const nodeIdMap = new Map<string, string>();
  const nodeLayouts = new Map<string, NodeLayout>(
    snapshot.nodes.map((node) => [
      node.id,
      {
        height: node.height,
        width: node.width,
        x: node.x,
        y: node.y,
      },
    ]),
  );
  const sanitizedActions: DesignAgentAction[] = [];

  const rawActions = plan.actions.slice(0, MAX_ACTIONS);

  for (const action of rawActions) {
    if (action.type !== "addNode") {
      continue;
    }

    const id = getUniqueId(action.id, existingNodeIds, "ai-node");
    const shape =
      action.shape && isNodeShape(action.shape) ? action.shape : "rectangle";
    const label = action.label?.trim().slice(0, 80) || "Untitled";
    const colorIndex = clampNumber(
      action.colorIndex ?? getSemanticColorIndex(label, shape),
      0,
      NODE_COLORS.length - 1,
    );
    const height = getNodeDimension(action.height, MIN_NODE_HEIGHT, 88);
    const width = getNodeDimension(action.width, MIN_NODE_WIDTH, 180);
    const x = getNodePosition(action.x, DEFAULT_CURSOR.flowX);
    const y = getNodePosition(action.y, DEFAULT_CURSOR.flowY);

    if (action.id) {
      nodeIdMap.set(action.id, id);
    }

    nodeLayouts.set(id, { height, width, x, y });

    sanitizedActions.push({
      colorIndex,
      height,
      id,
      label,
      shape,
      type: "addNode",
      width,
      x,
      y,
    });
  }

  for (const action of rawActions) {
    switch (action.type) {
      case "addNode": {
        break;
      }
      case "moveNode": {
        if (!action.id || !existingNodeIds.has(action.id)) {
          break;
        }

        const x = getNodePosition(action.x, DEFAULT_CURSOR.flowX);
        const y = getNodePosition(action.y, DEFAULT_CURSOR.flowY);
        const layout = nodeLayouts.get(action.id);

        if (layout) {
          nodeLayouts.set(action.id, {
            ...layout,
            x,
            y,
          });
        }

        sanitizedActions.push({
          id: action.id,
          type: "moveNode",
          x,
          y,
        });
        break;
      }
      case "resizeNode": {
        if (!action.id || !existingNodeIds.has(action.id)) {
          break;
        }

        const height = getNodeDimension(action.height, MIN_NODE_HEIGHT, 88);
        const width = getNodeDimension(action.width, MIN_NODE_WIDTH, 180);
        const layout = nodeLayouts.get(action.id);

        if (layout) {
          nodeLayouts.set(action.id, {
            ...layout,
            height,
            width,
          });
        }

        sanitizedActions.push({
          height,
          id: action.id,
          type: "resizeNode",
          width,
        });
        break;
      }
      case "updateNodeData": {
        if (!action.id || !existingNodeIds.has(action.id)) {
          break;
        }

        sanitizedActions.push({
          colorIndex:
            action.colorIndex === undefined
              ? undefined
              : clampNumber(action.colorIndex, 0, NODE_COLORS.length - 1),
          id: action.id,
          label: action.label?.trim().slice(0, 80),
          shape:
            action.shape === undefined || isNodeShape(action.shape)
              ? action.shape
              : undefined,
          type: "updateNodeData",
        });
        break;
      }
      case "deleteNode": {
        if (action.id && existingNodeIds.delete(action.id)) {
          nodeLayouts.delete(action.id);
          sanitizedActions.push({
            id: action.id,
            type: "deleteNode",
          });
        }
        break;
      }
      case "addEdge": {
        const source = action.source
          ? (nodeIdMap.get(action.source) ?? action.source)
          : undefined;
        const target = action.target
          ? (nodeIdMap.get(action.target) ?? action.target)
          : undefined;

        if (
          !source ||
          !target ||
          !existingNodeIds.has(source) ||
          !existingNodeIds.has(target)
        ) {
          break;
        }

        const sourceLayout = nodeLayouts.get(source);
        const targetLayout = nodeLayouts.get(target);

        if (!sourceLayout || !targetLayout) {
          break;
        }

        const defaultHandles = getDirectionalConnectionHandles(
          sourceLayout,
          targetLayout,
        );

        sanitizedActions.push({
          id: getUniqueId(action.id, existingEdgeIds, "ai-edge"),
          label: getMeaningfulEdgeLabel(action.label),
          source,
          sourceHandle: defaultHandles.sourceHandle,
          target,
          targetHandle: defaultHandles.targetHandle,
          type: "addEdge",
        });
        break;
      }
      case "deleteEdge": {
        if (action.id && existingEdgeIds.delete(action.id)) {
          sanitizedActions.push({
            id: action.id,
            type: "deleteEdge",
          });
        }
        break;
      }
    }
  }

  return sanitizedActions;
}

async function setAiPresenceBestEffort(
  roomId: string,
  cursor: { flowX: number; flowY: number } | null,
  thinking: boolean,
) {
  const client = getLiveblocksClient();

  await runBestEffortLiveblocksOperation(
    "Liveblocks set AI presence",
    client.setPresence(roomId, {
      data: { cursor, thinking },
      ttl: thinking ? 60 : 2,
      userId: AI_USER_ID,
      userInfo: AI_USER_INFO,
    }),
  );
}

async function publishStatusBestEffort(
  roomId: string,
  level: StatusLevel,
  message: string,
) {
  const client = getLiveblocksClient();
  const state = (
    level === "info" ? "working" : level
  ) satisfies AiStatusFeedState;

  await runBestEffortLiveblocksOperation(
    "Liveblocks publish design status",
    client.broadcastEvent(roomId, {
      payload: {
        createdAt: Date.now(),
        id: crypto.randomUUID(),
        scope: "design",
        state,
        text: message,
      },
      type: AI_STATUS_FEED_NAME,
    }),
  );
}

async function getCanvasSnapshot(roomId: string) {
  const client = getLiveblocksClient();
  let nodes: CanvasNode[] = [];
  let edges: CanvasEdge[] = [];

  await runLiveblocksOperation(
    "Liveblocks read canvas snapshot",
    mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
      nodes = [...flow.nodes];
      edges = [...flow.edges];
    }),
  );

  return getSnapshotForModel(nodes, edges);
}

async function generateDesignPlan(
  prompt: string,
  snapshot: CanvasSnapshotForModel,
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required.");
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const modelName =
    process.env.DESIGN_AGENT_MODEL?.trim() || DEFAULT_DESIGN_AGENT_MODEL;
  const model = google(modelName);

  logger.info("Gemini design planning started.", {
    model: modelName,
  });
  const { object } = await withTimeout(
    generateObject({
      maxOutputTokens: 2_500,
      maxRetries: 0,
      model,
      prompt: [
        "You are Ghost AI, a collaborative diagram design agent.",
        "Return a concise action plan that updates an existing React Flow canvas.",
        `Allowed node shapes: ${NODE_SHAPES.join(", ")}.`,
        "Use the full shape vocabulary when it matches the concept; do not default everything to rectangles.",
        "Shape semantics: circle = user/client/external actor, rectangle = ordinary service/component, pill = API/workflow/process, diamond = gateway/router/decision point, cylinder = database/cache/storage/bucket, hexagon = infrastructure/platform/pub-sub/cloud resource.",
        `Use colorIndex values from 0 to ${NODE_COLORS.length - 1}.`,
        "Use colors semantically and vary them across system roles: 1 blue = actors/clients, 2 purple = APIs/processes/services, 3 amber = gateways/routing/coordination, 4 red = auth/security/risk, 5 pink = media/notifications, 6 green = data/storage/cache/history, 7 teal = infrastructure/events/pub-sub/cloud resources, 0 neutral = generic fallback only.",
        "Do not assign colorIndex 0 to every new node; choose a meaningful color for each node role.",
        `Keep nodes at least ${MIN_NODE_WIDTH}px wide and ${MIN_NODE_HEIGHT}px tall.`,
        "Prefer clean left-to-right or top-to-bottom layouts with at least 220px horizontal spacing and 140px vertical spacing.",
        "Use short, scannable node labels. Preserve useful existing nodes unless the prompt clearly asks to remove them.",
        "Only label an edge when the label adds meaningful protocol, action, or data-flow detail such as WebSocket, publish, subscribe, read/write, stores media, or sends events.",
        "Do not label edges with generic words like connects, link, flow, data, request, response, or message. Leave the edge label empty instead.",
        "Lay out each flow so edges leave the upstream node from the side that faces the downstream node and enter the downstream node from the nearest opposite side.",
        "For new edges, set sourceHandle and targetHandle based on the actual flow direction: downward uses bottom-to-top, upward uses top-to-bottom, left-to-right uses right-to-left, and right-to-left uses left-to-right. Do not force every connection to bottom or right.",
        "Only use node IDs and edge IDs from the snapshot for update, move, resize, or delete actions.",
        "For newly added nodes and edges, create stable kebab-case IDs.",
        "Current canvas snapshot:",
        JSON.stringify(snapshot),
        "User prompt:",
        prompt,
      ].join("\n"),
      schema: designPlanSchema,
      temperature: 0.2,
    }),
    GEMINI_TIMEOUT_MS,
    "Gemini design planning",
  );
  logger.info("Gemini design planning completed.", {
    actionCount: object.actions.length,
  });

  return object;
}

async function applyActions(roomId: string, actions: DesignAgentAction[]) {
  const client = getLiveblocksClient();
  let appliedActions = 0;

  await runLiveblocksOperation(
    "Liveblocks apply canvas actions",
    mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
      for (const action of actions) {
        switch (action.type) {
          case "addNode": {
            flow.addNode({
              data: {
                color: NODE_COLORS[action.colorIndex],
                label: action.label,
                shape: action.shape,
              },
              id: action.id,
              position: { x: action.x, y: action.y },
              style: {
                height: action.height,
                width: action.width,
              },
              type: CANVAS_NODE_TYPE,
            });
            appliedActions += 1;
            break;
          }
          case "moveNode": {
            flow.updateNode(action.id, {
              position: { x: action.x, y: action.y },
            });
            appliedActions += 1;
            break;
          }
          case "resizeNode": {
            flow.updateNode(action.id, (node) => ({
              ...node,
              style: {
                ...node.style,
                height: action.height,
                width: action.width,
              },
            }));
            appliedActions += 1;
            break;
          }
          case "updateNodeData": {
            flow.updateNodeData(action.id, {
              ...(action.colorIndex === undefined
                ? {}
                : { color: NODE_COLORS[action.colorIndex] }),
              ...(action.label === undefined ? {} : { label: action.label }),
              ...(action.shape === undefined ? {} : { shape: action.shape }),
            });
            appliedActions += 1;
            break;
          }
          case "deleteNode": {
            const connectedEdgeIds = flow.edges
              .filter(
                (edge) =>
                  edge.source === action.id || edge.target === action.id,
              )
              .map((edge) => edge.id);

            if (connectedEdgeIds.length > 0) {
              flow.removeEdges(connectedEdgeIds);
            }

            flow.removeNode(action.id);
            appliedActions += 1;
            break;
          }
          case "addEdge": {
            flow.addEdge({
              data: { label: action.label ?? "" },
              id: action.id,
              markerEnd: {
                color: DEFAULT_EDGE_COLOR,
                type: MarkerType.ArrowClosed,
              },
              source: action.source,
              sourceHandle: action.sourceHandle,
              style: {
                stroke: DEFAULT_EDGE_COLOR,
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 1.5,
              },
              target: action.target,
              targetHandle: action.targetHandle,
              type: CANVAS_EDGE_TYPE,
            });
            appliedActions += 1;
            break;
          }
          case "deleteEdge": {
            flow.removeEdge(action.id);
            appliedActions += 1;
            break;
          }
        }
      }
    }),
  );

  return appliedActions;
}

export const designAgent = task({
  id: "design-agent",
  maxDuration: 180,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: DesignAgentPayload) => {
    logger.info("Design agent task started.", {
      prompt: payload.prompt,
      roomId: payload.roomId,
    });

    try {
      await publishStatusBestEffort(
        payload.roomId,
        "info",
        "Ghost AI is reading the canvas.",
      );
      await setAiPresenceBestEffort(payload.roomId, DEFAULT_CURSOR, true);

      const snapshot = await getCanvasSnapshot(payload.roomId);

      await setAiPresenceBestEffort(
        payload.roomId,
        { flowX: 360, flowY: 160 },
        true,
      );
      await publishStatusBestEffort(
        payload.roomId,
        "info",
        "Ghost AI is planning design changes.",
      );

      const plan = await generateDesignPlan(payload.prompt, snapshot);
      const actions = sanitizeActions(plan, snapshot);
      logger.info("Design agent plan sanitized.", {
        rawActionCount: plan.actions.length,
        sanitizedActionCount: actions.length,
      });

      await setAiPresenceBestEffort(
        payload.roomId,
        { flowX: 640, flowY: 280 },
        true,
      );
      await publishStatusBestEffort(
        payload.roomId,
        "info",
        "Ghost AI is updating the canvas.",
      );

      const appliedActions = await applyActions(payload.roomId, actions);

      await publishStatusBestEffort(
        payload.roomId,
        "success",
        appliedActions > 0
          ? `Ghost AI updated the canvas: ${plan.summary}`
          : "Ghost AI finished, but no valid canvas changes were needed.",
      );

      logger.info("Design agent task completed.", {
        actionCount: actions.length,
        appliedActions,
        roomId: payload.roomId,
      });

      return {
        appliedActions,
        roomId: payload.roomId,
        summary: plan.summary,
      };
    } catch (error) {
      const message = describeError(error);

      logger.error("Design agent task failed.", {
        error: message,
        roomId: payload.roomId,
      });
      await publishStatusBestEffort(
        payload.roomId,
        "error",
        "Ghost AI could not update the canvas.",
      );

      throw new AbortTaskRunError(message);
    } finally {
      await setAiPresenceBestEffort(payload.roomId, null, false);
    }
  },
});
