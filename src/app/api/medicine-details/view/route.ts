import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { apiHeaders } from "@/utils/apiHeaders";
import { formatError } from "@/utils/error-handlers";
import { getMedicineDetailViewByUuid } from "@/db/queries";
import { MedicineDetailView } from "@/types/medicine-detail";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const medicineUuid = searchParams.get("medicineUuid") as string;
    if (!medicineUuid) {
      return NextResponse.json(
        { error: "Required parameter 'medicineUuid' not found" },
        { status: 400, headers: apiHeaders }
      );
    }

    const response = await getMedicineDetailViewByUuid(medicineUuid);

    return NextResponse.json(
      { ...(camelcaseKeys(response, { deep: true }) as MedicineDetailView) },
      { status: 200, headers: apiHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error fetching medicine details view",
        details: formatError(error),
      },
      { status: 500 }
    );
  }
}
