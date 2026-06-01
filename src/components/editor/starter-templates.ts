import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
  NODE_COLORS,
  type NodeColor,
  type NodeShape,
} from "../../../types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface TemplateNodeInput {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: NodeShape;
  color: NodeColor;
}

interface TemplateEdgeInput {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

function templateNode({
  id,
  label,
  x,
  y,
  width,
  height,
  shape,
  color,
}: TemplateNodeInput): CanvasNode {
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    data: {
      label,
      color,
      shape,
    },
    style: {
      height,
      width,
    },
  };
}

function templateEdge({
  id,
  source,
  target,
  sourceHandle = "right",
  targetHandle = "left",
  label = "",
}: TemplateEdgeInput): CanvasEdge {
  return {
    id,
    source,
    sourceHandle,
    target,
    targetHandle,
    type: CANVAS_EDGE_TYPE,
    data: { label },
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-commerce",
    name: "Microservices Commerce",
    description:
      "A web storefront split across API gateway, services, async messaging, and dedicated data stores.",
    nodes: [
      templateNode({
        id: "ms-client",
        label: "Web Client",
        x: 0,
        y: 140,
        width: 150,
        height: 78,
        shape: "hexagon",
        color: NODE_COLORS[1],
      }),
      templateNode({
        id: "ms-gateway",
        label: "API Gateway",
        x: 240,
        y: 140,
        width: 160,
        height: 78,
        shape: "pill",
        color: NODE_COLORS[7],
      }),
      templateNode({
        id: "ms-orders",
        label: "Order Service",
        x: 500,
        y: 20,
        width: 160,
        height: 82,
        shape: "rectangle",
        color: NODE_COLORS[2],
      }),
      templateNode({
        id: "ms-payments",
        label: "Payment Service",
        x: 500,
        y: 140,
        width: 170,
        height: 82,
        shape: "rectangle",
        color: NODE_COLORS[4],
      }),
      templateNode({
        id: "ms-catalog",
        label: "Catalog Service",
        x: 500,
        y: 260,
        width: 170,
        height: 82,
        shape: "rectangle",
        color: NODE_COLORS[6],
      }),
      templateNode({
        id: "ms-events",
        label: "Event Bus",
        x: 760,
        y: 140,
        width: 150,
        height: 96,
        shape: "diamond",
        color: NODE_COLORS[3],
      }),
      templateNode({
        id: "ms-db",
        label: "Service Databases",
        x: 1000,
        y: 140,
        width: 170,
        height: 112,
        shape: "cylinder",
        color: NODE_COLORS[0],
      }),
    ],
    edges: [
      templateEdge({ id: "ms-e1", source: "ms-client", target: "ms-gateway" }),
      templateEdge({ id: "ms-e2", source: "ms-gateway", target: "ms-orders" }),
      templateEdge({
        id: "ms-e3",
        source: "ms-gateway",
        target: "ms-payments",
      }),
      templateEdge({ id: "ms-e4", source: "ms-gateway", target: "ms-catalog" }),
      templateEdge({ id: "ms-e5", source: "ms-orders", target: "ms-events" }),
      templateEdge({ id: "ms-e6", source: "ms-payments", target: "ms-events" }),
      templateEdge({ id: "ms-e7", source: "ms-catalog", target: "ms-db" }),
      templateEdge({ id: "ms-e8", source: "ms-events", target: "ms-db" }),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "A deployment flow from source control through build, tests, artifact storage, release approval, and production.",
    nodes: [
      templateNode({
        id: "ci-repo",
        label: "Git Repository",
        x: 0,
        y: 120,
        width: 160,
        height: 78,
        shape: "hexagon",
        color: NODE_COLORS[1],
      }),
      templateNode({
        id: "ci-build",
        label: "Build Job",
        x: 240,
        y: 120,
        width: 150,
        height: 78,
        shape: "pill",
        color: NODE_COLORS[7],
      }),
      templateNode({
        id: "ci-tests",
        label: "Test Matrix",
        x: 480,
        y: 120,
        width: 150,
        height: 98,
        shape: "diamond",
        color: NODE_COLORS[5],
      }),
      templateNode({
        id: "ci-artifacts",
        label: "Artifact Registry",
        x: 720,
        y: 20,
        width: 170,
        height: 110,
        shape: "cylinder",
        color: NODE_COLORS[2],
      }),
      templateNode({
        id: "ci-approval",
        label: "Release Gate",
        x: 720,
        y: 210,
        width: 160,
        height: 96,
        shape: "diamond",
        color: NODE_COLORS[3],
      }),
      templateNode({
        id: "ci-prod",
        label: "Production",
        x: 980,
        y: 120,
        width: 160,
        height: 78,
        shape: "rectangle",
        color: NODE_COLORS[6],
      }),
    ],
    edges: [
      templateEdge({ id: "ci-e1", source: "ci-repo", target: "ci-build" }),
      templateEdge({ id: "ci-e2", source: "ci-build", target: "ci-tests" }),
      templateEdge({
        id: "ci-e3",
        source: "ci-tests",
        target: "ci-artifacts",
      }),
      templateEdge({
        id: "ci-e4",
        source: "ci-tests",
        target: "ci-approval",
      }),
      templateEdge({
        id: "ci-e5",
        source: "ci-artifacts",
        target: "ci-prod",
      }),
      templateEdge({
        id: "ci-e6",
        source: "ci-approval",
        target: "ci-prod",
      }),
    ],
  },
  {
    id: "event-driven-orders",
    name: "Event-Driven Orders",
    description:
      "An event-first order workflow with producers, broker topics, independent consumers, projections, and notifications.",
    nodes: [
      templateNode({
        id: "ev-api",
        label: "Order API",
        x: 0,
        y: 150,
        width: 150,
        height: 78,
        shape: "pill",
        color: NODE_COLORS[7],
      }),
      templateNode({
        id: "ev-broker",
        label: "Message Broker",
        x: 250,
        y: 135,
        width: 160,
        height: 110,
        shape: "cylinder",
        color: NODE_COLORS[2],
      }),
      templateNode({
        id: "ev-inventory",
        label: "Inventory Consumer",
        x: 520,
        y: 0,
        width: 180,
        height: 82,
        shape: "rectangle",
        color: NODE_COLORS[6],
      }),
      templateNode({
        id: "ev-billing",
        label: "Billing Consumer",
        x: 520,
        y: 140,
        width: 180,
        height: 82,
        shape: "rectangle",
        color: NODE_COLORS[4],
      }),
      templateNode({
        id: "ev-email",
        label: "Notification Worker",
        x: 520,
        y: 280,
        width: 190,
        height: 82,
        shape: "rectangle",
        color: NODE_COLORS[5],
      }),
      templateNode({
        id: "ev-read-model",
        label: "Read Model",
        x: 820,
        y: 140,
        width: 150,
        height: 104,
        shape: "cylinder",
        color: NODE_COLORS[0],
      }),
      templateNode({
        id: "ev-dashboard",
        label: "Ops Dashboard",
        x: 1080,
        y: 150,
        width: 160,
        height: 78,
        shape: "hexagon",
        color: NODE_COLORS[1],
      }),
    ],
    edges: [
      templateEdge({ id: "ev-e1", source: "ev-api", target: "ev-broker" }),
      templateEdge({
        id: "ev-e2",
        source: "ev-broker",
        target: "ev-inventory",
      }),
      templateEdge({
        id: "ev-e3",
        source: "ev-broker",
        target: "ev-billing",
      }),
      templateEdge({ id: "ev-e4", source: "ev-broker", target: "ev-email" }),
      templateEdge({
        id: "ev-e5",
        source: "ev-inventory",
        target: "ev-read-model",
      }),
      templateEdge({
        id: "ev-e6",
        source: "ev-billing",
        target: "ev-read-model",
      }),
      templateEdge({
        id: "ev-e7",
        source: "ev-read-model",
        target: "ev-dashboard",
      }),
    ],
  },
];
