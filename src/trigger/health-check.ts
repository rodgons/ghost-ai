import { task } from "@trigger.dev/sdk";

interface TriggerHealthCheckPayload {
  message?: string;
}

export const triggerHealthCheck = task({
  id: "trigger-health-check",
  run: async (payload: TriggerHealthCheckPayload) => {
    return {
      ok: true,
      message: payload.message ?? "Trigger.dev is configured for Ghost AI.",
    };
  },
});
