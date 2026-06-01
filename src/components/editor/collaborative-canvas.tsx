"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  type Connection,
  ConnectionMode,
  type DefaultEdgeOptions,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  Handle,
  MarkerType,
  type NodeProps,
  NodeResizer,
  NodeToolbar,
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
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
  NODE_COLORS,
  NODE_SHAPES,
  type NodeColor,
  type NodeShape,
} from "../../../types/canvas";
import type { CanvasTemplate } from "./starter-templates";

interface CollaborativeCanvasProps {
  roomId: string;
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
        color={data.color.text}
        handleClassName="!h-2 !w-2 !rounded-full !border !border-background !bg-muted-foreground"
        isVisible={selected}
        lineClassName="!border-muted-foreground/60"
        minHeight={MIN_NODE_HEIGHT}
        minWidth={MIN_NODE_WIDTH}
      />
      <ShapeBackground
        color={data.color}
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
          style={getLabelOutlineStyle(data.color)}
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
              style={getLabelOutlineStyle(data.color)}
            >
              {data.label}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}

const nodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
};

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

const edgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
};

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
        style={{ color: DEFAULT_NODE_COLOR.text }}
      >
        <ShapeBackground
          color={DEFAULT_NODE_COLOR}
          selected
          shape={preview.shape}
        />
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

function SyncedCanvas({
  templateImportRequest,
}: {
  templateImportRequest: CanvasTemplateImportRequest | null;
}) {
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const lastTemplateImportIdRef = useRef<number | null>(null);
  const shapeNodeCounterRef = useRef(0);
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

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    const payload = readShapeDragPayload(event);
    if (payload) {
      setDragPreview({
        ...payload,
        x: event.clientX,
        y: event.clientY,
      });
    }
  }, []);

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
    [clearDragPreview, onNodesChange, screenToFlowPosition],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={directedEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onReconnect={handleReconnect}
      onDelete={onDelete}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
      <Cursors />
      <CanvasControls />
      <ShapePanel
        onDragCancel={clearDragPreview}
        onDragMove={updateDragPreview}
        onDragStart={updateDragPreview}
      />
      <ShapeDragPreview preview={dragPreview} />
    </ReactFlow>
  );
}

export function CollaborativeCanvas({
  roomId,
  templateImportRequest,
}: CollaborativeCanvasProps) {
  return (
    <main className="h-[calc(100vh-3.5rem)] flex-1 bg-background">
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, isThinking: false }}
        >
          <CanvasErrorBoundary fallback={<CanvasConnectionError />}>
            <ClientSideSuspense fallback={<CanvasLoading />}>
              <ReactFlowProvider>
                <SyncedCanvas templateImportRequest={templateImportRequest} />
              </ReactFlowProvider>
            </ClientSideSuspense>
          </CanvasErrorBoundary>
        </RoomProvider>
      </LiveblocksProvider>
    </main>
  );
}
