"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CanvasEdge, CanvasNode, NodeShape } from "../../../types/canvas";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

interface NodePreviewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PREVIEW_WIDTH = 260;
const PREVIEW_HEIGHT = 260;
const PREVIEW_PADDING = 22;
const FALLBACK_NODE_WIDTH = 140;
const FALLBACK_NODE_HEIGHT = 80;

function getNumericSize(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function getNodeBox(node: CanvasNode): NodePreviewBox {
  return {
    x: node.position.x,
    y: node.position.y,
    width: getNumericSize(node.style?.width, FALLBACK_NODE_WIDTH),
    height: getNumericSize(node.style?.height, FALLBACK_NODE_HEIGHT),
  };
}

function getPreviewTransform(nodes: CanvasNode[]) {
  const boxes = nodes.map(getNodeBox);
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  const contentWidth = Math.max(maxX - minX, 1);
  const contentHeight = Math.max(maxY - minY, 1);
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / contentWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / contentHeight,
  );
  const offsetX = (PREVIEW_WIDTH - contentWidth * scale) / 2 - minX * scale;
  const offsetY = (PREVIEW_HEIGHT - contentHeight * scale) / 2 - minY * scale;

  return { offsetX, offsetY, scale };
}

function getNodeCenter(node: CanvasNode) {
  const box = getNodeBox(node);

  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function transformPoint(
  point: { x: number; y: number },
  transform: ReturnType<typeof getPreviewTransform>,
) {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY,
  };
}

function transformBox(
  box: NodePreviewBox,
  transform: ReturnType<typeof getPreviewTransform>,
) {
  return {
    x: box.x * transform.scale + transform.offsetX,
    y: box.y * transform.scale + transform.offsetY,
    width: box.width * transform.scale,
    height: box.height * transform.scale,
  };
}

function PreviewNodeShape({
  box,
  color,
  label,
  shape,
}: {
  box: NodePreviewBox;
  color: CanvasNode["data"]["color"];
  label: string;
  shape: NodeShape;
}) {
  const strokeColor = `color-mix(in srgb, ${color.text} 56%, transparent)`;

  if (shape === "diamond") {
    return (
      <polygon
        fill={color.fill}
        points={`${box.x + box.width / 2},${box.y} ${box.x + box.width},${
          box.y + box.height / 2
        } ${box.x + box.width / 2},${box.y + box.height} ${box.x},${
          box.y + box.height / 2
        }`}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    );
  }

  if (shape === "hexagon") {
    return (
      <polygon
        fill={color.fill}
        points={`${box.x + box.width * 0.25},${box.y} ${
          box.x + box.width * 0.75
        },${box.y} ${box.x + box.width},${box.y + box.height / 2} ${
          box.x + box.width * 0.75
        },${box.y + box.height} ${box.x + box.width * 0.25},${
          box.y + box.height
        } ${box.x},${box.y + box.height / 2}`}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    );
  }

  if (shape === "cylinder") {
    const radiusY = Math.min(box.height * 0.16, 10);

    return (
      <>
        <path
          d={`M${box.x} ${box.y + radiusY} C${box.x} ${box.y} ${
            box.x + box.width
          } ${box.y} ${box.x + box.width} ${box.y + radiusY} V${
            box.y + box.height - radiusY
          } C${box.x + box.width} ${box.y + box.height} ${box.x} ${
            box.y + box.height
          } ${box.x} ${box.y + box.height - radiusY} Z`}
          fill={color.fill}
          stroke={strokeColor}
          strokeWidth="1.5"
        />
        <ellipse
          cx={box.x + box.width / 2}
          cy={box.y + radiusY}
          fill={color.fill}
          rx={box.width / 2}
          ry={radiusY}
          stroke={strokeColor}
          strokeWidth="1.5"
        />
      </>
    );
  }

  return (
    <rect
      fill={color.fill}
      height={box.height}
      rx={shape === "rectangle" ? 6 : box.height / 2}
      stroke={strokeColor}
      strokeWidth="1.5"
      width={box.width}
      x={box.x}
      y={box.y}
    >
      <title>{label}</title>
    </rect>
  );
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const transform = getPreviewTransform(template.nodes);
  const nodeById = new Map(template.nodes.map((node) => [node.id, node]));

  return (
    <svg
      aria-hidden="true"
      className="aspect-square w-full rounded-xl border border-border bg-background"
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
    >
      {template.edges.map((edge: CanvasEdge) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);

        if (!source || !target) {
          return null;
        }

        const sourceCenter = transformPoint(getNodeCenter(source), transform);
        const targetCenter = transformPoint(getNodeCenter(target), transform);

        return (
          <line
            key={edge.id}
            stroke="var(--foreground)"
            strokeLinecap="round"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            x1={sourceCenter.x}
            x2={targetCenter.x}
            y1={sourceCenter.y}
            y2={targetCenter.y}
          />
        );
      })}
      {template.nodes.map((node) => {
        const box = transformBox(getNodeBox(node), transform);

        return (
          <g key={node.id}>
            <PreviewNodeShape
              box={box}
              color={node.data.color}
              label={node.data.label}
              shape={node.data.shape}
            />
            <text
              dominantBaseline="middle"
              fill={node.data.color.text}
              fontSize="8"
              fontWeight="600"
              paintOrder="stroke"
              stroke={node.data.color.fill}
              strokeLinejoin="round"
              strokeWidth="3"
              textAnchor="middle"
              x={box.x + box.width / 2}
              y={box.y + box.height / 2}
            >
              {node.data.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StarterTemplatesModal({
  open,
  onImport,
  onOpenChange,
}: StarterTemplatesModalProps) {
  const importTemplate = (template: CanvasTemplate) => {
    onImport(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] overflow-hidden rounded-3xl p-0 sm:max-w-[72rem] xl:max-w-[80rem]">
        <DialogHeader className="border-b border-border px-6 pt-6 pb-5">
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Import a prebuilt system diagram into this canvas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[34rem] gap-6 overflow-y-auto p-6 md:grid-cols-2 xl:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <article
              className="flex min-h-[27rem] flex-col gap-4 rounded-2xl border border-border bg-card p-4"
              key={template.id}
            >
              <TemplatePreview template={template} />
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">
                  {template.name}
                </h3>
                <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <Button
                className="mt-auto w-full"
                onClick={() => importTemplate(template)}
                size="sm"
                type="button"
              >
                Import
              </Button>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
