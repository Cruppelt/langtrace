import { authOptions } from "@/lib/auth/options";
import { TraceService } from "@/lib/services/trace_service";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") as string;
    const page = (req.nextUrl.searchParams.get("page") as unknown as number) || 1;
    const pageSize = (req.nextUrl.searchParams.get("pageSize") as unknown as number) || 10;

    if (!projectId) {
      return NextResponse.json(
        { error: "Please provide a projectId or spanId" },
        { status: 400 }
      );
    }

    const traceService = new TraceService();

    if (projectId) {
      const prompts = await traceService.GetSpansWithAttribute(
        "llm.prompts",
        projectId, 
        page, 
        pageSize
      );
      return NextResponse.json(
        { prompts },
        {
          status: 200,
        }
      );
    }
  } catch (error) {
    return NextResponse.json(JSON.stringify({ error }), {
      status: 400,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }
  
  const data = await req.json();
  const { id } = data;

  const prompt = await prisma.prompt.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({});
}
