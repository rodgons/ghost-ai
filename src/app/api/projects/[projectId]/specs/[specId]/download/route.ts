import { get } from "@vercel/blob";
import prisma from "@/lib/prisma";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";

export const runtime = "nodejs";

interface SpecDownloadRouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

function getDownloadFilename(specId: string) {
  return `ghost-ai-spec-${specId}.md`;
}

export async function GET(
  _request: Request,
  { params }: SpecDownloadRouteContext,
) {
  const { projectId, specId } = await params;
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

  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { filePath: true },
  });

  if (!spec) {
    return new Response(null, { status: 404 });
  }

  try {
    const blob = await get(spec.filePath, {
      access: "private",
      useCache: false,
    });

    if (!blob) {
      return Response.json(
        { error: "Generated spec could not be loaded." },
        { status: 502 },
      );
    }

    return new Response(blob.stream, {
      headers: {
        "Content-Disposition": `attachment; filename="${getDownloadFilename(specId)}"`,
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch {
    return Response.json(
      { error: "Generated spec could not be loaded." },
      { status: 502 },
    );
  }
}
