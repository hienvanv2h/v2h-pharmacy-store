import { NextRequest, NextResponse } from "next/server";

import { getTotalQuantityByMedicinesUuid } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const medicineUuid = searchParams.get("medicineUuid") as string;

    if (!medicineUuid) {
      return NextResponse.json(
        { error: "Required parameter 'medicineUuid' not found" },
        { status: 400 }
      );
    }

    const { totalQuantity } =
      (await getTotalQuantityByMedicinesUuid(medicineUuid)) || 0;
    return NextResponse.json({ totalQuantity }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching total quantity", details: formatError(error) },
      { status: 500 }
    );
  }
}
