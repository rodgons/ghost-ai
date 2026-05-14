import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import crypto from "crypto";

interface CreateProjectBody {
  name?: string;
}

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
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateProjectBody;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  try {
    const name = body.name || "Untitled Project";
    const projectId = crypto.randomUUID();

    const project = await prisma.project.create({
      data: {
        id: projectId,
        name,
        ownerId: userId,
        canvasJsonPath: `canvas/${projectId}.json`,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
