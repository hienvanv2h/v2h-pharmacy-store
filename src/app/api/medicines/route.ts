import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { getAllMedicines } from "@/db/queries";
import { MedicineView } from "@/types/medicine";
import { formatError } from "@/utils/error-handlers";
import { createMedicineAndDetailTransaction } from "@/db/transactions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  try {
    if (
      isNaN(Number(page)) ||
      Number(page) < 0 ||
      isNaN(Number(limit)) ||
      Number(limit) < 0
    ) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const { data, totalItems } = await getAllMedicines(
      Number(page),
      Number(limit)
    );
    const result: MedicineView[] = camelcaseKeys(data, {
      deep: true,
    }) as MedicineView[];

    return NextResponse.json({ result, totalItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching medicines", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { medicineDto, medicineDetailDto } = await request.json();
  if (!medicineDto) {
    return NextResponse.json(
      { error: "Required medicine data not found" },
      { status: 400 }
    );
  }

  try {
    const response = await createMedicineAndDetailTransaction(
      medicineDto,
      medicineDetailDto
    );
    if (response) {
      return NextResponse.json(
        { message: "Medicine created successfully" },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: "Medicine not created due to conflict or constraint" },
        { status: 409 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error when creating medicine", details: formatError(error) },
      { status: 500 }
    );
  }
}
