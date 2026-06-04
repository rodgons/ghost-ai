-- AlterTable
ALTER TABLE "TaskRun" ADD COLUMN "idempotencyKey" TEXT;

-- Backfill existing task runs so the new unique key can be enforced.
UPDATE "TaskRun" SET "idempotencyKey" = "runId" WHERE "idempotencyKey" IS NULL;

-- AlterTable
ALTER TABLE "TaskRun" ALTER COLUMN "idempotencyKey" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TaskRun_idempotencyKey_key" ON "TaskRun"("idempotencyKey");
