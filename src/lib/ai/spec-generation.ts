import { z } from "zod";

const chatMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(4_000),
    role: z.enum(["assistant", "user"]),
  })
  .passthrough();

const canvasNodeSchema = z
  .object({
    id: z.string().trim().min(1),
  })
  .passthrough();

const canvasEdgeSchema = z
  .object({
    id: z.string().trim().min(1),
  })
  .passthrough();

export const specGenerationRequestSchema = z.object({
  chatHistory: z.array(chatMessageSchema).max(100),
  edges: z.array(canvasEdgeSchema).max(400),
  nodes: z.array(canvasNodeSchema).max(300),
  roomId: z.string().trim().min(1),
});

export const specGenerationTaskPayloadSchema =
  specGenerationRequestSchema.extend({
    projectId: z.string().trim().min(1),
  });

export const specRunTokenRequestSchema = z.object({
  runId: z.string().trim().min(1),
});

export type SpecGenerationRequest = z.infer<typeof specGenerationRequestSchema>;

export type SpecGenerationTaskPayload = z.infer<
  typeof specGenerationTaskPayloadSchema
>;

export function parseSpecGenerationRequest(body: unknown) {
  return specGenerationRequestSchema.safeParse(body);
}

export function parseSpecRunTokenRequest(body: unknown) {
  return specRunTokenRequestSchema.safeParse(body);
}
