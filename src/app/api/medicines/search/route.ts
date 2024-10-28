import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { getFilteredMedicines } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";
import { MedicineDetailView } from "@/types/medicine-detail";

const headers = {
  "Access-Control-Allow-Origin": "*",
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoriesParam = searchParams.get("categories") as string;
    const categories = categoriesParam ? categoriesParam.split(",") : [];
    const brandName = searchParams.get("brandName") as string;
    const keyword = searchParams.get("keyword") as string;

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    if (isInvalidParameter(page) || isInvalidParameter(limit)) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400, headers }
      );
    }

    const { data, totalItems } = await getFilteredMedicines(
      { categories, brandName, keyword },
      Number(page),
      Number(limit)
    );
    const result: MedicineDetailView[] = camelcaseKeys(data, {
      deep: true,
    }) as MedicineDetailView[];
    return NextResponse.json({ result, totalItems }, { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching medicines", details: formatError(error) },
      { status: 500, headers }
    );
  }
}

function isInvalidParameter(param: string): boolean {
  return isNaN(Number(param)) || Number(param) < 0;
}
