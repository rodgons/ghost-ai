import { auth } from "@clerk/nextjs/server";
import prisma from "../../../../lib/prisma";

export async function GET(_request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(null, { status: 401 });
  }
  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return new Response(JSON.stringify(projects), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(null, { status: 401 });
  }
  const body = await request.json();
  const name = body?.name?.trim() || "Untitled Project";
  const description = body?.description?.trim() || undefined;
  const newProject = await prisma.project.create({
    data: {
      ownerId: userId,
      name,
      description,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return new Response(JSON.stringify(newProject), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
