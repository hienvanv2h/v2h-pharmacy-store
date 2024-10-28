import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { MedicineBatch } from "@/types/medicine-batch";
import { getMedicinesBatchesByMedicinesUuid } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const medicineUuid = searchParams.get("medicineUuid") as string;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    if (!medicineUuid) {
      return NextResponse.json(
        { error: "Required parameter 'medicineUuid' not found" },
        { status: 400 }
      );
    }

    if (
      isNaN(Number(page)) ||
      Number(page) < 0 ||
      isNaN(Number(limit)) ||
      Number(limit) < 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid parameters: page and limit must be positive numbers",
        },
        { status: 400 }
      );
    }

    const { data, totalItems } = await getMedicinesBatchesByMedicinesUuid(
      medicineUuid,
      Number(page),
      Number(limit)
    );
    const result = camelcaseKeys(data, { deep: true }) as MedicineBatch[];
    return NextResponse.json({ result, totalItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching medicine batches", details: formatError(error) },
      { status: 500 }
    );
  }
}
