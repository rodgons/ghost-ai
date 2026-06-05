import prisma from "@/lib/prisma";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";

export const runtime = "nodejs";

interface ProjectSpecsRouteContext {
  params: Promise<{ projectId: string }>;
}

function getSpecFilename(specId: string) {
  return `ghost-ai-spec-${specId}.md`;
}

export async function GET(
  _request: Request,
  { params }: ProjectSpecsRouteContext,
) {
  const { projectId } = await params;
  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return new Response(null, { status: 401 });
  }

  const hasAccess = await canAccessProject(
    projectId,
    identity.userId,
    identity.email,
  );

  if (!hasAccess) {
    return new Response(null, { status: 403 });
  }

  const specs = await prisma.projectSpec.findMany({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, id: true },
    where: { projectId },
  });

  return Response.json({
    specs: specs.map((spec) => ({
      createdAt: spec.createdAt.toISOString(),
      filename: getSpecFilename(spec.id),
      id: spec.id,
    })),
  });
}
