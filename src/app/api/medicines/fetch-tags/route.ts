import { NextRequest, NextResponse } from "next/server";

import { getAllMedicinesTags } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";

export async function GET(request: NextRequest) {
  try {
    const response = await getAllMedicinesTags();
    const tags = response.map((row: any) => row.tag);

    return NextResponse.json(tags, {
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching categories", details: formatError(error) },
      { status: 500 }
    );
  }
}
