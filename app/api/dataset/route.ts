import { authOptions } from "@/lib/auth/options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const id = req.nextUrl.searchParams.get("id") as string;
  const datasetId = req.nextUrl.searchParams.get("dataset_id") as string;
  if (!datasetId && !id) {
    return NextResponse.json(
      {
        error: "No dataset id or project id provided",
      },
      { status: 404 }
    );
  }

  if (datasetId) {
    // get the dataset and all the data for this dataset and sort them by createdAt
    const dataset = await prisma.dataset.findFirst({
      where: {
        id: datasetId,
      },
      include: {
        Data: true,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        {
          error: "No datasets found",
        },
        { status: 404 }
      );
    }

    // If dataset exists, fetch related Data records ordered by createdAt
    const relatedData = await prisma.data.findMany({
      where: {
        datasetId: dataset.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Combine dataset with its related, ordered Data
    const datasetWithOrderedData = {
      ...dataset,
      Data: relatedData,
    };

    return NextResponse.json({
      datasets: datasetWithOrderedData,
    });
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
    },
  });

  if (!project) {
    return NextResponse.json(
      {
        error: "No projects found",
      },
      { status: 404 }
    );
  }

  // get all the datasets for this project and sort them by createdAt
  const datasets = await prisma.dataset.findMany({
    where: {
      projectId: id,
    },
    include: {
      Data: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    datasets: datasets,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { name, description, projectId } = data;

  const dataset = await prisma.dataset.create({
    data: {
      name,
      description,
      projectId,
    },
  });

  return NextResponse.json({
    dataset: dataset,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id, name, description } = data;

  const dataset = await prisma.dataset.update({
    where: {
      id,
    },
    data: {
      name,
      description,
    },
  });

  return NextResponse.json({
    dataset: dataset,
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const data = await req.json();
  const { id } = data;

  const dataset = await prisma.dataset.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({});
}
