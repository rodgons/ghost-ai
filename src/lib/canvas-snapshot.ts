import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasSnapshot,
  NODE_SHAPES,
  type NodeColor,
  type NodeShape,
} from "../../types/canvas";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNodeShape(value: unknown): value is NodeShape {
  return typeof value === "string" && NODE_SHAPES.includes(value as NodeShape);
}

function isNodeColor(value: unknown): value is NodeColor {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.fill === "string" &&
    value.fill.trim().length > 0 &&
    typeof value.text === "string" &&
    value.text.trim().length > 0
  );
}

function isPosition(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.x === "number" &&
    Number.isFinite(value.x) &&
    typeof value.y === "number" &&
    Number.isFinite(value.y)
  );
}

function isCanvasNode(value: unknown) {
  if (!isRecord(value) || !isRecord(value.data)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    value.type === CANVAS_NODE_TYPE &&
    isPosition(value.position) &&
    typeof value.data.label === "string" &&
    isNodeColor(value.data.color) &&
    isNodeShape(value.data.shape)
  );
}

function isCanvasEdge(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  const data = value.data;
  const hasValidData =
    data === undefined ||
    (isRecord(data) &&
      (data.label === undefined || typeof data.label === "string"));

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.source === "string" &&
    value.source.trim().length > 0 &&
    typeof value.target === "string" &&
    value.target.trim().length > 0 &&
    (value.type === undefined || value.type === CANVAS_EDGE_TYPE) &&
    hasValidData
  );
}

export function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.nodes) &&
    Array.isArray(value.edges) &&
    value.nodes.every(isCanvasNode) &&
    value.edges.every(isCanvasEdge)
  );
}
