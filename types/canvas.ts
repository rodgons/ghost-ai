import type { Edge, Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode";
export const CANVAS_EDGE_TYPE = "canvasEdge";

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export const LIGHT_NODE_COLORS = [
  { fill: "#F8FAFC", text: "#1F2937" },
  { fill: "#EAF4FF", text: "#1268B3" },
  { fill: "#F4ECFF", text: "#7E35B8" },
  { fill: "#FFF3E0", text: "#B65E00" },
  { fill: "#FFECEC", text: "#C8353A" },
  { fill: "#FFEAF2", text: "#C73667" },
  { fill: "#EAF8EE", text: "#287D3C" },
  { fill: "#E5FBF8", text: "#067B70" },
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];
export type NodeColor = {
  fill: string;
  text: string;
};
export type CanvasTheme = "dark" | "light";

export function getThemedNodeColor(
  color: NodeColor,
  theme: CanvasTheme,
): NodeColor {
  if (theme === "dark") {
    return color;
  }

  const colorIndex = NODE_COLORS.findIndex(
    (candidate) =>
      candidate.fill === color.fill && candidate.text === color.text,
  );

  return colorIndex >= 0 ? LIGHT_NODE_COLORS[colorIndex] : color;
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: NodeColor;
  shape: NodeShape;
}

export interface CanvasEdgeData extends Record<string, unknown> {
  label: string;
}

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;
export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>;

export interface CanvasSnapshot {
  edges: CanvasEdge[];
  nodes: CanvasNode[];
}
