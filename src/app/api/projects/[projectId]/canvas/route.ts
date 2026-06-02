import { BlobPreconditionFailedError, del, get, head, put } from "@vercel/blob";
import { isCanvasSnapshot } from "@/lib/canvas-snapshot";
import prisma from "@/lib/prisma";
import {
  canAccessProject,
  getCurrentClerkIdentity,
} from "@/lib/project-access";

export const runtime = "nodejs";

interface CanvasRouteContext {
  params: Promise<{ projectId: string }>;
}

async function verifyProjectAccess(projectId: string) {
  const identity = await getCurrentClerkIdentity();

  if (!identity) {
    return { status: 401 as const };
  }

  const hasAccess = await canAccessProject(
    projectId,
    identity.userId,
    identity.email,
  );

  if (!hasAccess) {
    return { status: 403 as const };
  }

  return { status: 200 as const };
}

export async function GET(_request: Request, { params }: CanvasRouteContext) {
  const { projectId } = await params;
  const access = await verifyProjectAccess(projectId);

  if (access.status !== 200) {
    return new Response(null, { status: access.status });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project) {
    return new Response(null, { status: 404 });
  }

  if (!project.canvasJsonPath) {
    return Response.json({ canvas: null });
  }

  const blob = await get(project.canvasJsonPath, {
    access: "private",
    useCache: false,
  });

  if (!blob || blob.statusCode !== 200) {
    return Response.json(
      { error: "Saved canvas could not be loaded." },
      { status: 502 },
    );
  }

  const savedCanvas: unknown = await new Response(blob.stream)
    .json()
    .catch(() => null);

  if (!isCanvasSnapshot(savedCanvas)) {
    return Response.json(
      { error: "Saved canvas is not valid." },
      { status: 502 },
    );
  }

  return Response.json({ canvas: savedCanvas });
}

export async function PUT(request: Request, { params }: CanvasRouteContext) {
  const { projectId } = await params;
  const access = await verifyProjectAccess(projectId);

  if (access.status !== 200) {
    return new Response(null, { status: access.status });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, canvasJsonPath: true },
  });

  if (!project) {
    return new Response(null, { status: 404 });
  }

  const canvas: unknown = await request.json().catch(() => null);

  if (!isCanvasSnapshot(canvas)) {
    return Response.json({ error: "Invalid canvas JSON." }, { status: 400 });
  }

  let savedBlob: Awaited<ReturnType<typeof put>>;
  const currentCanvasPath = project.canvasJsonPath;

  try {
    const uploadOptions: Parameters<typeof put>[2] = {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    };

    if (currentCanvasPath) {
      const metadata = await head(currentCanvasPath);

      uploadOptions.ifMatch = metadata.etag;
    }

    savedBlob = await put(
      `canvas/${projectId}.json`,
      JSON.stringify(canvas),
      uploadOptions,
    );
  } catch (error: unknown) {
    if (error instanceof BlobPreconditionFailedError) {
      return Response.json(
        { error: "Canvas save conflict. Please retry." },
        { status: 409 },
      );
    }

    throw error;
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: savedBlob.url },
      select: { id: true },
    });
  } catch (error: unknown) {
    if (currentCanvasPath && currentCanvasPath !== savedBlob.url) {
      await del(savedBlob.url).catch(() => null);
    }

    throw error;
  }

  return Response.json({ canvasJsonPath: savedBlob.url });
}
