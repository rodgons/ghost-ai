import crypto from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

interface CreateProjectBody {
  id?: string;
  name?: string;
}

/**
 * Determines whether a value is a valid project id in slug format.
 *
 * @param value - The value to validate as a project id
 * @returns `true` if `value` is a string containing only lowercase letters, digits, and hyphens, matches the slug pattern (no leading/trailing or consecutive hyphens), and is at least 3 characters long; `false` otherwise.
 */
function isValidProjectId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) &&
    value.length >= 3
  );
}

/**
 * Handle GET requests to list projects owned by the authenticated user.
 *
 * @returns `200` with the authenticated user's projects as JSON; `401` with `{ error: "Unauthorized" }` if the request is unauthenticated; `500` with `{ error: "Internal Server Error" }` if an internal error occurs.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        ownerId: userId,
      },
    });

    return NextResponse.json(projects, { status: 200 });
  } catch (_error) {
    console.error("[PROJECTS_GET]", _error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Create a new project owned by the authenticated user.
 *
 * Accepts a JSON body with optional `id` (slug) and `name`. If `id` is omitted or empty a UUID is generated; if `name` is omitted it defaults to `"Untitled Project"`.
 *
 * @param req - The incoming request whose JSON body may include `{ id?: string, name?: string }`
 * @returns The created project object
 */
export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateProjectBody;
  try {
    body = await req.json();
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be an object" },
      { status: 400 },
    );
  }

  if (body.name !== undefined && typeof body.name !== "string") {
    return NextResponse.json(
      { error: "Project name must be a string" },
      { status: 400 },
    );
  }

  if (body.id !== undefined && !isValidProjectId(body.id)) {
    return NextResponse.json(
      { error: "Project id must be a valid slug" },
      { status: 400 },
    );
  }

  try {
    const name = body.name || "Untitled Project";
    const projectId =
      typeof body.id === "string" && body.id.length > 0
        ? body.id
        : crypto.randomUUID();

    const project = await prisma.project.create({
      data: {
        id: projectId,
        name,
        ownerId: userId,
        canvasJsonPath: `canvas/${projectId}.json`,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (_error) {
    console.error("[PROJECTS_POST]", _error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
