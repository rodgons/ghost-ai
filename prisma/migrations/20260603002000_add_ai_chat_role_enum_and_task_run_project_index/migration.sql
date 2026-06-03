-- CreateEnum
CREATE TYPE "AiChatMessageRole" AS ENUM ('assistant', 'user');

-- AlterTable
ALTER TABLE "AiChatMessage"
ALTER COLUMN "role" TYPE "AiChatMessageRole"
USING "role"::"AiChatMessageRole";

-- CreateIndex
CREATE INDEX "TaskRun_projectId_idx" ON "TaskRun"("projectId");
