import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { getMedicinesContainsTags } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";
import { MedicineView } from "@/types/medicine";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tags = JSON.parse(searchParams.get("tags") || "[]");
    if (!Array.isArray(tags)) {
      throw new Error("Tags must be an array");
    }

    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

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

    const { data, totalItems } = await getMedicinesContainsTags(
      tags,
      Number(page),
      Number(limit)
    );
    const result: MedicineView[] = camelcaseKeys(data, {
      deep: true,
    }) as MedicineView[];
    return NextResponse.json({ result, totalItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching tags", details: formatError(error) },
      { status: 500 }
    );
  }
}
