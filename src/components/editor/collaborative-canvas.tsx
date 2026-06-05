"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import {
  ClientSideSuspense,
  shallow,
  useCanRedo,
  useCanUndo,
  useEventListener,
  useOthers,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  type Connection,
  ConnectionMode,
  type DefaultEdgeOptions,
  EdgeLabelRenderer,
  type EdgeProps,
  type EdgeTypes,
  getSmoothStepPath,
  Handle,
  MarkerType,
  type NodeProps,
  NodeResizer,
  NodeToolbar,
  type NodeTypes,
  type OnNodeDrag,
  type OnReconnect,
  PanOnScrollMode,
  Position,
  ReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  useReactFlow,
} from "@xyflow/react";
import {
  Circle,
  Database,
  Diamond,
  Hexagon,
  Loader2,
  type LucideIcon,
  Maximize2,
  Minus,
  Pill,
  Plus,
  RectangleHorizontal,
  Redo2,
  Undo2,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CanvasErrorBoundary } from "@/components/editor/canvas-error-boundary";
import { useTheme } from "@/components/theme-provider";
import {
  type CanvasSaveStatus,
  useCanvasAutosave,
} from "@/hooks/use-canvas-autosave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { isCanvasSnapshot } from "@/lib/canvas-snapshot";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
  type CanvasSnapshot,
  getThemedNodeColor,
  NODE_COLORS,
  NODE_SHAPES,
  type NodeColor,
  type NodeShape,
} from "../../../types/canvas";
import {
  AI_STATUS_FEED_NAME,
  type AiStatusFeedPayload,
  parseAiStatusFeedPayload,
} from "../../../types/tasks";
import type { CanvasTemplate } from "./starter-templates";

interface CollaborativeCanvasProps {
  onCanvasSnapshotChange: (snapshot: CanvasSnapshot) => void;
  onSaveStatusChange: (status: CanvasSaveStatus) => void;
  projectId: string;
  templateImportRequest: CanvasTemplateImportRequest | null;
}

export interface CanvasTemplateImportRequest {
  id: number;
  template: CanvasTemplate;
}

interface ShapeSize {
  width: number;
  height: number;
}

interface ShapeDragPayload {
  shape: NodeShape;
  size: ShapeSize;
}

interface ShapeOption extends ShapeDragPayload {
  label: string;
  Icon: LucideIcon;
}

interface CollaboratorPresence {
  avatarUrl: string;
  connectionId: number;
  cursor: { flowX: number; flowY: number } | null;
  cursorColor: string;
  displayName: string;
  thinking: boolean;
}

interface DragPreviewState extends ShapeDragPayload {
  x: number;
  y: number;
}

interface ShapePanelProps {
  onDragCancel: () => void;
  onDragMove: (
    event: DragEvent<HTMLElement>,
    payload: ShapeDragPayload,
  ) => void;
  onDragStart: (
    event: DragEvent<HTMLElement>,
    payload: ShapeDragPayload,
  ) => void;
}

const SHAPE_DRAG_MIME_TYPE = "application/x-ghost-ai-shape";

const DEFAULT_NODE_COLOR = NODE_COLORS[0];
const DEFAULT_EDGE_COLOR = "var(--foreground)";
const VIEWPORT_ANIMATION_DURATION = 180;
const MIN_NODE_HEIGHT = 64;
const MIN_NODE_WIDTH = 96;
const EDGE_ARROW_MARKER = {
  type: MarkerType.ArrowClosed,
  color: DEFAULT_EDGE_COLOR,
} as const;
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  markerEnd: EDGE_ARROW_MARKER,
  style: {
    stroke: DEFAULT_EDGE_COLOR,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.5,
  },
};
const CONNECTION_HANDLES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

const SHAPE_OPTIONS: ShapeOption[] = [
  {
    shape: "rectangle",
    label: "Rectangle",
    size: { width: 180, height: 88 },
    Icon: RectangleHorizontal,
  },
  {
    shape: "diamond",
    label: "Diamond",
    size: { width: 148, height: 148 },
    Icon: Diamond,
  },
  {
    shape: "circle",
    label: "Circle",
    size: { width: 112, height: 112 },
    Icon: Circle,
  },
  {
    shape: "pill",
    label: "Pill",
    size: { width: 164, height: 72 },
    Icon: Pill,
  },
  {
    shape: "cylinder",
    label: "Cylinder",
    size: { width: 136, height: 104 },
    Icon: Database,
  },
  {
    shape: "hexagon",
    label: "Hexagon",
    size: { width: 156, height: 96 },
    Icon: Hexagon,
  },
];

function isShapeDragPayload(value: unknown): value is ShapeDragPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Partial<ShapeDragPayload>;

  return (
    typeof payload.shape === "string" &&
    NODE_SHAPES.includes(payload.shape as NodeShape) &&
    typeof payload.size === "object" &&
    payload.size !== null &&
    typeof payload.size.width === "number" &&
    typeof payload.size.height === "number"
  );
}

function readShapeDragPayload(
  event: DragEvent<HTMLDivElement>,
): ShapeDragPayload | null {
  const rawPayload = event.dataTransfer.getData(SHAPE_DRAG_MIME_TYPE);

  if (!rawPayload) {
    return null;
  }

  try {
    const parsedPayload: unknown = JSON.parse(rawPayload);
    return isShapeDragPayload(parsedPayload) ? parsedPayload : null;
  } catch {
    return null;
  }
}

function getStrokeColor(color: CanvasNode["data"]["color"], selected: boolean) {
  return selected
    ? color.text
    : `color-mix(in srgb, ${color.text} 48%, transparent)`;
}

function getLabelOutlineStyle(color: CanvasNode["data"]["color"]) {
  return {
    color: color.text,
    textShadow: [
      `0 1px 0 ${color.fill}`,
      `1px 0 0 ${color.fill}`,
      `0 -1px 0 ${color.fill}`,
      `-1px 0 0 ${color.fill}`,
      `0 0 10px ${color.fill}`,
    ].join(", "),
  };
}

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return "G";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function useCollaboratorPresence(currentUserId: string | null | undefined) {
  return useOthers(
    (others) =>
      others
        .filter((other) => other.id !== currentUserId)
        .map(
          (other): CollaboratorPresence => ({
            avatarUrl: other.info.avatarUrl,
            connectionId: other.connectionId,
            cursor: other.presence.cursor,
            cursorColor: other.info.cursorColor,
            displayName: other.info.displayName,
            thinking: other.presence.thinking,
          }),
        ),
    shallow,
  );
}

function ShapeBackground({
  color,
  selected,
  shape,
}: {
  color: CanvasNode["data"]["color"];
  selected: boolean;
  shape: NodeShape;
}) {
  const shapeClassName =
    shape === "circle"
      ? "rounded-full"
      : shape === "pill"
        ? "rounded-full"
        : "rounded-xl";
  const strokeColor = getStrokeColor(color, selected);
  const strokeWidth = selected ? 2.5 : 1.5;

  if (shape === "diamond") {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill={color.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          points="25,2 75,2 98,50 75,98 25,98 2,50"
          fill={color.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (shape === "cylinder") {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M8 18 C8 8 92 8 92 18 V82 C92 92 8 92 8 82 Z"
          fill={color.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <ellipse
          cx="50"
          cy="18"
          fill={color.fill}
          rx="42"
          ry="12"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <path
          d="M8 82 C8 72 92 72 92 82"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  return (
    <div
      className={`absolute inset-0 border ${shapeClassName}`}
      style={{
        backgroundColor: color.fill,
        borderColor: strokeColor,
        borderWidth: strokeWidth,
      }}
    />
  );
}

function isSameNodeColor(color: NodeColor, candidate: NodeColor) {
  return color.fill === candidate.fill && color.text === candidate.text;
}

function ColorToolbar({
  color,
  nodeId,
  selected,
}: {
  color: NodeColor;
  nodeId: string;
  selected: boolean;
}) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();

  const stopToolbarInteraction = (
    event: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
  };

  const selectColor = (
    event: MouseEvent<HTMLButtonElement>,
    nextColor: NodeColor,
  ) => {
    stopToolbarInteraction(event);
    updateNodeData(nodeId, {
      color: nextColor,
    });
  };

  return (
    <NodeToolbar
      align="center"
      isVisible={selected}
      nodeId={nodeId}
      offset={14}
      position={Position.Top}
    >
      <div className="nodrag nopan flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur">
        {NODE_COLORS.map((candidate) => {
          const isActive = isSameNodeColor(color, candidate);

          return (
            <button
              aria-label="Set node color"
              aria-pressed={isActive}
              className="h-6 w-6 rounded-full border transition-[border-color,box-shadow,transform] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-pressed:scale-110"
              key={`${candidate.fill}-${candidate.text}`}
              onClick={(event) => selectColor(event, candidate)}
              style={{
                backgroundColor: candidate.fill,
                borderColor: isActive ? candidate.text : "var(--border)",
                boxShadow: isActive
                  ? `0 0 0 2px ${candidate.text}`
                  : `0 0 0 0 ${candidate.text}`,
              }}
              title="Set node color"
              type="button"
              onDoubleClick={stopToolbarInteraction}
              onMouseEnter={(event) => {
                event.currentTarget.style.boxShadow = isActive
                  ? `0 0 0 2px ${candidate.text}`
                  : `0 0 8px -2px ${candidate.text}`;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.boxShadow = isActive
                  ? `0 0 0 2px ${candidate.text}`
                  : `0 0 0 0 ${candidate.text}`;
              }}
              onPointerDown={stopToolbarInteraction}
            />
          );
        })}
      </div>
    </NodeToolbar>
  );
}

function CanvasNodeRenderer({ data, id, selected }: NodeProps<CanvasNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const { theme } = useTheme();
  const displayColor = getThemedNodeColor(data.color, theme);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const handleLabelChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, {
      label: event.currentTarget.value,
    });
  };

  const stopTextInteraction = (event: PointerEvent | DragEvent) => {
    event.stopPropagation();
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();

    if (event.key === "Escape") {
      setIsEditing(false);
      event.currentTarget.blur();
    }
  };

  return (
    <div className="group relative flex h-full min-h-16 w-full min-w-24 items-center justify-center px-3 py-2 text-center text-sm font-medium shadow-sm">
      <ColorToolbar color={data.color} nodeId={id} selected={selected} />
      <NodeResizer
        color={displayColor.text}
        handleClassName="!h-2 !w-2 !rounded-full !border !border-background !bg-muted-foreground"
        isVisible={selected}
        lineClassName="!border-muted-foreground/60"
        minHeight={MIN_NODE_HEIGHT}
        minWidth={MIN_NODE_WIDTH}
      />
      <ShapeBackground
        color={displayColor}
        selected={selected}
        shape={data.shape}
      />
      {CONNECTION_HANDLES.map((handle) => (
        <Handle
          className="!h-2.5 !w-2.5 !border !border-background !bg-foreground opacity-0 transition-opacity group-hover:opacity-100"
          id={handle.id}
          key={handle.id}
          position={handle.position}
          type="source"
        />
      ))}
      {isEditing ? (
        <textarea
          aria-label="Node label"
          className="nodrag nopan relative z-10 m-0 max-h-full min-h-0 w-full resize-none overflow-hidden border-none bg-transparent p-0 text-center font-medium leading-snug outline-none placeholder:text-muted-foreground"
          onBlur={() => setIsEditing(false)}
          onChange={handleLabelChange}
          onDoubleClick={(event) => event.stopPropagation()}
          onDragStart={stopTextInteraction}
          onKeyDown={handleEditorKeyDown}
          onPointerDown={stopTextInteraction}
          ref={textareaRef}
          rows={2}
          style={getLabelOutlineStyle(displayColor)}
          value={data.label}
        />
      ) : (
        <button
          className="relative z-10 flex h-full w-full cursor-grab items-center justify-center border-none bg-transparent p-0 text-center font-medium outline-none active:cursor-grabbing"
          onDoubleClick={(event) => {
            event.stopPropagation();
            setIsEditing(true);
          }}
          type="button"
        >
          {data.label ? (
            <span
              className="max-w-full break-words text-center leading-snug"
              style={getLabelOutlineStyle(displayColor)}
            >
              {data.label}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}

const canvasNodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
} satisfies NodeTypes;

function CanvasEdgeRenderer({
  data,
  id,
  markerEnd,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  style,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<CanvasEdge>) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const label = data?.label ?? "";
  const isActive = selected || isHovered || isEditing;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    borderRadius: 16,
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const saveLabel = (nextLabel: string) => {
    updateEdgeData(id, {
      label: nextLabel.trim(),
    });
  };

  const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateEdgeData(id, {
      label: event.currentTarget.value,
    });
  };

  const handleLabelKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();

    if (event.key === "Enter" || event.key === "Escape") {
      saveLabel(event.currentTarget.value);
      setIsEditing(false);
      event.currentTarget.blur();
    }
  };

  const stopLabelInteraction = (event: MouseEvent | PointerEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      <BaseEdge
        id={id}
        interactionWidth={20}
        markerEnd={markerEnd}
        onDoubleClick={(event) => {
          event.stopPropagation();
          setIsEditing(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        path={edgePath}
        style={{
          ...style,
          opacity: isActive ? 0.95 : 0.45,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: isActive ? 2 : 1.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            pointerEvents: "all",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {isEditing ? (
            <input
              aria-label="Edge label"
              className="min-w-12 rounded-full border border-border bg-card/95 px-2 py-1 text-center text-xs font-medium text-foreground shadow-xl outline-none backdrop-blur focus:border-ring"
              onBlur={(event) => {
                saveLabel(event.currentTarget.value);
                setIsEditing(false);
              }}
              onChange={handleLabelChange}
              onClick={stopLabelInteraction}
              onKeyDown={handleLabelKeyDown}
              onPointerDown={stopLabelInteraction}
              ref={inputRef}
              style={{ width: `${Math.max(label.length, 4) + 2}ch` }}
              value={label}
            />
          ) : label ? (
            <button
              className="rounded-full border border-border bg-card/90 px-2 py-1 text-xs font-medium text-foreground shadow-lg backdrop-blur"
              onClick={stopLabelInteraction}
              onDoubleClick={(event) => {
                stopLabelInteraction(event);
                setIsEditing(true);
              }}
              onPointerDown={stopLabelInteraction}
              type="button"
            >
              {label}
            </button>
          ) : isActive ? (
            <button
              className="rounded-full border border-border bg-card/60 px-2 py-1 text-xs font-medium text-muted-foreground/70 backdrop-blur"
              onClick={stopLabelInteraction}
              onDoubleClick={(event) => {
                stopLabelInteraction(event);
                setIsEditing(true);
              }}
              onPointerDown={stopLabelInteraction}
              type="button"
            >
              Label
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const canvasEdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
} satisfies EdgeTypes;

function CanvasControlButton({
  "aria-label": ariaLabel,
  children,
  disabled = false,
  onClick,
}: {
  "aria-label": string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function CanvasControls() {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ reactFlow, redo, undo });

  const zoomOut = () => {
    void reactFlow.zoomOut({ duration: VIEWPORT_ANIMATION_DURATION });
  };

  const zoomIn = () => {
    void reactFlow.zoomIn({ duration: VIEWPORT_ANIMATION_DURATION });
  };

  const fitView = () => {
    void reactFlow.fitView({
      duration: VIEWPORT_ANIMATION_DURATION,
      padding: 0.18,
    });
  };

  return (
    <div className="pointer-events-auto absolute bottom-24 left-6 z-10 flex items-center gap-1 rounded-full border border-border bg-card/90 p-1.5 shadow-xl backdrop-blur">
      <div className="flex items-center gap-1">
        <CanvasControlButton aria-label="Zoom out" onClick={zoomOut}>
          <Minus aria-hidden="true" className="h-4 w-4" />
        </CanvasControlButton>
        <CanvasControlButton aria-label="Fit view" onClick={fitView}>
          <Maximize2 aria-hidden="true" className="h-4 w-4" />
        </CanvasControlButton>
        <CanvasControlButton aria-label="Zoom in" onClick={zoomIn}>
          <Plus aria-hidden="true" className="h-4 w-4" />
        </CanvasControlButton>
      </div>
      <div className="mx-1 h-6 w-px bg-border" />
      <div className="flex items-center gap-1">
        <CanvasControlButton
          aria-label="Undo"
          disabled={!canUndo}
          onClick={undo}
        >
          <Undo2 aria-hidden="true" className="h-4 w-4" />
        </CanvasControlButton>
        <CanvasControlButton
          aria-label="Redo"
          disabled={!canRedo}
          onClick={redo}
        >
          <Redo2 aria-hidden="true" className="h-4 w-4" />
        </CanvasControlButton>
      </div>
    </div>
  );
}

function CollaboratorAvatar({
  avatarUrl,
  cursorColor,
  displayName,
  thinking,
}: Pick<
  CollaboratorPresence,
  "avatarUrl" | "cursorColor" | "displayName" | "thinking"
>) {
  const initials = getInitials(displayName);

  return (
    <div
      aria-label={displayName}
      className="-ml-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-background text-[11px] font-semibold text-foreground shadow-lg first:ml-0"
      role="img"
      style={{
        backgroundColor: cursorColor,
        backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
        backgroundPosition: "center",
        backgroundSize: "cover",
        boxShadow: thinking
          ? "0 0 0 1px var(--border), 0 0 0 4px hsl(var(--accent))"
          : "0 0 0 1px var(--border)",
      }}
      title={displayName}
    >
      {avatarUrl ? null : initials}
    </div>
  );
}

function PresenceAvatarGroup() {
  const { userId } = useAuth();
  const collaborators = useCollaboratorPresence(userId);
  const visibleCollaborators = collaborators.slice(0, 5);
  const overflowCount = collaborators.length - visibleCollaborators.length;

  return (
    <div className="pointer-events-auto absolute right-6 top-6 z-30 flex items-center rounded-full border border-border bg-card/90 px-2 py-1.5 shadow-xl backdrop-blur">
      {visibleCollaborators.length > 0 ? (
        <div className="flex items-center pl-2">
          {visibleCollaborators.map((collaborator) => (
            <CollaboratorAvatar
              avatarUrl={collaborator.avatarUrl}
              cursorColor={collaborator.cursorColor}
              displayName={collaborator.displayName}
              key={collaborator.connectionId}
              thinking={collaborator.thinking}
            />
          ))}
          {overflowCount > 0 ? (
            <div className="-ml-2 flex h-8 min-w-8 items-center justify-center rounded-full border border-background bg-muted px-2 text-xs font-semibold text-muted-foreground shadow-lg">
              +{overflowCount}
            </div>
          ) : null}
        </div>
      ) : null}
      {visibleCollaborators.length > 0 ? (
        <div className="mx-2 h-6 w-px bg-border" />
      ) : null}
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: "h-8 w-8",
          },
        }}
      />
    </div>
  );
}

function DesignAgentStatusFeed() {
  const [message, setMessage] = useState<AiStatusFeedPayload | null>(null);

  useEventListener(({ event }) => {
    if (event.type !== AI_STATUS_FEED_NAME) {
      return;
    }

    const payload = parseAiStatusFeedPayload(event.payload);

    if (!payload) {
      return;
    }

    setMessage(payload);
  });

  useEffect(() => {
    if (!message) {
      return;
    }

    const visibleMessageId = message.id;
    const timeoutId = window.setTimeout(() => {
      setMessage((currentMessage) =>
        currentMessage?.id === visibleMessageId ? null : currentMessage,
      );
    }, 5_000);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  if (!message?.text) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-30 flex w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2">
      <div className="rounded-lg border border-border bg-card/95 px-4 py-3 text-sm text-foreground shadow-xl backdrop-blur">
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="mt-1 h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor:
                message.state === "error"
                  ? "hsl(var(--destructive))"
                  : message.state === "success"
                    ? "hsl(var(--accent-foreground))"
                    : "hsl(var(--muted-foreground))",
            }}
          />
          <p className="min-w-0 leading-5">{message.text}</p>
        </div>
      </div>
    </div>
  );
}

function LiveCursor({ participant }: { participant: CollaboratorPresence }) {
  const { flowToScreenPosition } = useReactFlow();

  if (!participant.cursor) {
    return null;
  }

  const screenPosition = flowToScreenPosition({
    x: participant.cursor.flowX,
    y: participant.cursor.flowY,
  });

  return (
    <div
      className="absolute left-0 top-0 flex items-start"
      style={{
        color: participant.cursorColor,
        transform: `translate(${screenPosition.x}px, ${screenPosition.y}px)`,
      }}
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5 drop-shadow"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M4 2.5 16.5 10 10.2 11.4 7 17.2 4 2.5Z" />
      </svg>
      <div
        className="ml-1 mt-3 flex max-w-40 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-background shadow-lg"
        style={{ backgroundColor: participant.cursorColor }}
      >
        {participant.thinking ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
        ) : null}
        <span className="min-w-0 truncate">{participant.displayName}</span>
      </div>
    </div>
  );
}

function LiveCursors() {
  const { userId } = useAuth();
  const collaborators = useCollaboratorPresence(userId);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {collaborators.map((participant) => (
        <LiveCursor key={participant.connectionId} participant={participant} />
      ))}
    </div>
  );
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background text-sm text-muted-foreground">
      Loading canvas...
    </div>
  );
}

function CanvasConnectionError() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-6 text-center">
      <div>
        <h2 className="text-sm font-medium text-foreground">
          Canvas connection failed
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Check your connection and refresh the workspace.
        </p>
      </div>
    </div>
  );
}

function ShapeDragPreview({ preview }: { preview: DragPreviewState | null }) {
  const { theme } = useTheme();
  const displayColor = getThemedNodeColor(DEFAULT_NODE_COLOR, theme);

  if (!preview) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-70"
      style={{
        height: preview.size.height,
        left: preview.x,
        top: preview.y,
        width: preview.size.width,
      }}
    >
      <div
        className="relative h-full w-full"
        style={{ color: displayColor.text }}
      >
        <ShapeBackground color={displayColor} selected shape={preview.shape} />
      </div>
    </div>
  );
}

function ShapePanel({
  onDragCancel,
  onDragMove,
  onDragStart,
}: ShapePanelProps) {
  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    payload: ShapeDragPayload,
  ) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(SHAPE_DRAG_MIME_TYPE, JSON.stringify(payload));
    event.dataTransfer.setDragImage(document.createElement("canvas"), 0, 0);
    onDragStart(event, payload);
  };

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/90 p-1.5 shadow-xl backdrop-blur">
      {SHAPE_OPTIONS.map(({ shape, label, size, Icon }) => (
        <button
          aria-label={label}
          className="flex h-10 w-10 cursor-grab items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
          draggable
          key={shape}
          onDrag={(event) => onDragMove(event, { shape, size })}
          onDragEnd={onDragCancel}
          onDragStart={(event) => handleDragStart(event, { shape, size })}
          title={label}
          type="button"
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}

function isRecordWithCanvas(
  value: unknown,
): value is { canvas: CanvasSnapshot | null } {
  return typeof value === "object" && value !== null && "canvas" in value;
}

function SyncedCanvas({
  onCanvasSnapshotChange,
  onSaveStatusChange,
  projectId,
  templateImportRequest,
}: {
  onCanvasSnapshotChange: (snapshot: CanvasSnapshot) => void;
  onSaveStatusChange: (status: CanvasSaveStatus) => void;
  projectId: string;
  templateImportRequest: CanvasTemplateImportRequest | null;
}) {
  "use no memo";

  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const [hasCheckedSavedCanvas, setHasCheckedSavedCanvas] = useState(false);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const lastTemplateImportIdRef = useRef<number | null>(null);
  const latestCanvasCountsRef = useRef({ edges: 0, nodes: 0 });
  const savedCanvasLoadStartedRef = useRef(false);
  const shapeNodeCounterRef = useRef(0);
  const updateMyPresence = useUpdateMyPresence();
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });
  const directedEdges = useMemo(
    () =>
      edges.map(
        (edge): CanvasEdge => ({
          ...edge,
          data: {
            label: "",
            ...edge.data,
          },
          markerEnd: edge.markerEnd ?? EDGE_ARROW_MARKER,
          type: CANVAS_EDGE_TYPE,
          style: {
            ...DEFAULT_EDGE_OPTIONS.style,
            ...edge.style,
          },
        }),
      ),
    [edges],
  );
  const saveStatus = useCanvasAutosave({
    edges: directedEdges,
    enabled: hasCheckedSavedCanvas,
    nodes,
    projectId,
  });
  const addCanvasSnapshot = useCallback(
    (canvas: CanvasSnapshot) => {
      onNodesChange(
        canvas.nodes.map((node) => ({
          type: "add",
          item: node,
        })),
      );
      onEdgesChange(
        canvas.edges.map((edge) => ({
          type: "add",
          item: edge,
        })),
      );
    },
    [onEdgesChange, onNodesChange],
  );

  useEffect(() => {
    onSaveStatusChange(saveStatus);
  }, [onSaveStatusChange, saveStatus]);

  useEffect(() => {
    if (!hasCheckedSavedCanvas) {
      return;
    }

    onCanvasSnapshotChange({ edges: directedEdges, nodes });
  }, [directedEdges, hasCheckedSavedCanvas, nodes, onCanvasSnapshotChange]);

  useEffect(() => {
    latestCanvasCountsRef.current = {
      edges: directedEdges.length,
      nodes: nodes.length,
    };
  }, [directedEdges.length, nodes.length]);

  useEffect(() => {
    if (savedCanvasLoadStartedRef.current) {
      return;
    }

    savedCanvasLoadStartedRef.current = true;

    if (nodes.length > 0 || directedEdges.length > 0) {
      setHasCheckedSavedCanvas(true);
      return;
    }

    let isCancelled = false;

    async function loadSavedCanvas() {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`);

        if (!response.ok) {
          throw new Error("Saved canvas load failed.");
        }

        const result: unknown = await response.json();
        const canvas = isRecordWithCanvas(result) ? result.canvas : null;

        if (
          isCancelled ||
          !isCanvasSnapshot(canvas) ||
          latestCanvasCountsRef.current.nodes > 0 ||
          latestCanvasCountsRef.current.edges > 0
        ) {
          return;
        }

        addCanvasSnapshot(canvas);
      } catch {
        if (!isCancelled) {
          onSaveStatusChange("error");
        }
      } finally {
        if (!isCancelled) {
          setHasCheckedSavedCanvas(true);
        }
      }
    }

    void loadSavedCanvas();

    return () => {
      isCancelled = true;
    };
  }, [
    directedEdges.length,
    nodes.length,
    onSaveStatusChange,
    projectId,
    addCanvasSnapshot,
  ]);

  useEffect(() => {
    if (!templateImportRequest) {
      return;
    }

    if (lastTemplateImportIdRef.current === templateImportRequest.id) {
      return;
    }

    lastTemplateImportIdRef.current = templateImportRequest.id;
    onDelete({ nodes, edges: directedEdges });
    onNodesChange(
      templateImportRequest.template.nodes.map((node) => ({
        type: "add",
        item: node,
      })),
    );
    onEdgesChange(
      templateImportRequest.template.edges.map((edge) => ({
        type: "add",
        item: edge,
      })),
    );

    window.requestAnimationFrame(() => {
      void reactFlow.fitView({
        duration: VIEWPORT_ANIMATION_DURATION,
        padding: 0.18,
      });
    });
  }, [
    directedEdges,
    nodes,
    onDelete,
    onEdgesChange,
    onNodesChange,
    reactFlow,
    templateImportRequest,
  ]);

  const updateCursorFromClientPosition = useCallback(
    ({ clientX, clientY }: { clientX: number; clientY: number }) => {
      const bounds = canvasViewportRef.current?.getBoundingClientRect();

      if (!bounds) {
        return;
      }

      const flowPosition = screenToFlowPosition({
        x: clientX,
        y: clientY,
      });

      updateMyPresence({
        cursor: {
          flowX: flowPosition.x,
          flowY: flowPosition.y,
        },
      });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      updateCursorFromClientPosition(event);

      const payload = readShapeDragPayload(event);
      if (payload) {
        setDragPreview({
          ...payload,
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [updateCursorFromClientPosition],
  );

  const updateDragPreview = useCallback(
    (event: DragEvent<HTMLElement>, payload: ShapeDragPayload) => {
      if (event.clientX === 0 && event.clientY === 0) {
        return;
      }

      setDragPreview({
        ...payload,
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  const clearDragPreview = useCallback(() => {
    setDragPreview(null);
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      const newEdge: CanvasEdge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle,
        data: { label: "" },
        markerEnd: EDGE_ARROW_MARKER,
        type: CANVAS_EDGE_TYPE,
        style: DEFAULT_EDGE_OPTIONS.style,
      };

      onEdgesChange([{ type: "add", item: newEdge }]);
    },
    [onEdgesChange],
  );

  const handleReconnect = useCallback<OnReconnect<CanvasEdge>>(
    (oldEdge, newConnection) => {
      const updatedEdges = reconnectEdge(
        oldEdge,
        newConnection,
        directedEdges,
        {
          shouldReplaceId: false,
        },
      );
      const updatedEdge = updatedEdges.find((edge) => edge.id === oldEdge.id);

      if (!updatedEdge) {
        return;
      }

      onEdgesChange([
        {
          id: oldEdge.id,
          item: updatedEdge,
          type: "replace",
        },
      ]);
    },
    [directedEdges, onEdgesChange],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      updateCursorFromClientPosition(event);

      const payload = readShapeDragPayload(event);

      if (!payload) {
        clearDragPreview();
        return;
      }

      clearDragPreview();
      shapeNodeCounterRef.current += 1;

      const dropPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const position = {
        x: dropPosition.x - payload.size.width / 2,
        y: dropPosition.y - payload.size.height / 2,
      };

      const newNode: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${shapeNodeCounterRef.current}`,
        type: CANVAS_NODE_TYPE,
        position,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
        style: {
          width: payload.size.width,
          height: payload.size.height,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [
      clearDragPreview,
      onNodesChange,
      screenToFlowPosition,
      updateCursorFromClientPosition,
    ],
  );

  const updateCursorPresence = useCallback(
    (event: MouseEvent<Element>) => {
      updateCursorFromClientPosition(event);
    },
    [updateCursorFromClientPosition],
  );

  const updateCursorDuringNodeDrag = useCallback<OnNodeDrag<CanvasNode>>(
    (event) => {
      updateCursorFromClientPosition(event);
    },
    [updateCursorFromClientPosition],
  );

  const startMovingShapes = useCallback<OnNodeDrag<CanvasNode>>(
    (event) => {
      updateCursorFromClientPosition(event);
    },
    [updateCursorFromClientPosition],
  );

  const stopMovingShapes = useCallback<OnNodeDrag<CanvasNode>>(
    (event) => {
      updateCursorFromClientPosition(event);
    },
    [updateCursorFromClientPosition],
  );

  const startSelectionMove = useCallback(
    (event: MouseEvent<Element>) => {
      updateCursorFromClientPosition(event);
    },
    [updateCursorFromClientPosition],
  );

  const stopSelectionMove = useCallback(
    (event: MouseEvent<Element>) => {
      updateCursorFromClientPosition(event);
    },
    [updateCursorFromClientPosition],
  );

  const clearCursorPresence = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      ref={canvasViewportRef}
    >
      <ReactFlow
        nodes={nodes}
        edges={directedEdges}
        nodeTypes={canvasNodeTypes}
        edgeTypes={canvasEdgeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onReconnect={handleReconnect}
        onDelete={onDelete}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseLeave={clearCursorPresence}
        onMouseMove={updateCursorPresence}
        onNodeDrag={updateCursorDuringNodeDrag}
        onNodeDragStart={startMovingShapes}
        onNodeDragStop={stopMovingShapes}
        onSelectionDrag={updateCursorPresence}
        onSelectionDragStart={startSelectionMove}
        onSelectionDragStop={stopSelectionMove}
        connectionMode={ConnectionMode.Loose}
        edgesReconnectable
        reconnectRadius={14}
        panOnDrag={[1, 2]}
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        zoomActivationKeyCode={["Control", "Meta"]}
        zoomOnScroll
        fitView
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--muted-foreground)"
        />
        <CanvasControls />
        <ShapePanel
          onDragCancel={clearDragPreview}
          onDragMove={updateDragPreview}
          onDragStart={updateDragPreview}
        />
        <ShapeDragPreview preview={dragPreview} />
      </ReactFlow>
      <PresenceAvatarGroup />
      <DesignAgentStatusFeed />
      <LiveCursors />
    </div>
  );
}

export function CollaborativeCanvas({
  onCanvasSnapshotChange,
  onSaveStatusChange,
  projectId,
  templateImportRequest,
}: CollaborativeCanvasProps) {
  return (
    <main className="h-[calc(100vh-3.5rem)] flex-1 bg-background">
      <CanvasErrorBoundary fallback={<CanvasConnectionError />}>
        <ClientSideSuspense fallback={<CanvasLoading />}>
          <ReactFlowProvider>
            <SyncedCanvas
              onCanvasSnapshotChange={onCanvasSnapshotChange}
              onSaveStatusChange={onSaveStatusChange}
              projectId={projectId}
              templateImportRequest={templateImportRequest}
            />
          </ReactFlowProvider>
        </ClientSideSuspense>
      </CanvasErrorBoundary>
    </main>
  );
}
