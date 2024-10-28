import { NextRequest, NextResponse } from "next/server";

import { formatError } from "@/utils/error-handlers";
import { getAllMedicinesBrandName } from "@/db/queries";

export async function GET(request: NextRequest) {
  try {
    const response = await getAllMedicinesBrandName();
    const brandNames: string[] = [];

    response.map((brandNameObj: any) => {
      brandNames.push(brandNameObj.brandName);
    });

    return NextResponse.json(brandNames, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching brands", details: formatError(error) },
      { status: 500 }
    );
  }
}
