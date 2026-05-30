"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
} from "@xyflow/react";
import { CanvasErrorBoundary } from "@/components/editor/canvas-error-boundary";
import type { CanvasEdge, CanvasNode } from "../../../types/canvas";

interface CollaborativeCanvasProps {
  roomId: string;
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

function SyncedCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      connectionMode={ConnectionMode.Loose}
      fitView
      className="bg-background"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="var(--muted-foreground)"
      />
      <MiniMap
        pannable
        zoomable
        bgColor="var(--background)"
        maskColor="color-mix(in srgb, var(--background) 72%, transparent)"
        nodeColor="var(--primary)"
      />
      <Cursors />
    </ReactFlow>
  );
}

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  return (
    <main className="h-[calc(100vh-3.5rem)] flex-1 bg-background">
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, isThinking: false }}
        >
          <CanvasErrorBoundary fallback={<CanvasConnectionError />}>
            <ClientSideSuspense fallback={<CanvasLoading />}>
              <SyncedCanvas />
            </ClientSideSuspense>
          </CanvasErrorBoundary>
        </RoomProvider>
      </LiveblocksProvider>
    </main>
  );
}
