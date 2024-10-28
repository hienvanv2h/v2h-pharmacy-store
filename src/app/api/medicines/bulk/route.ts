import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { formatError } from "@/utils/error-handlers";
import { getMedicinesByUuids } from "@/db/queries";
import { MedicineView } from "@/types/medicine";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
};

export async function POST(request: NextRequest) {
  try {
    const { uuids } = await request.json();
    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty uuids list" },
        { status: 400, headers }
      );
    }

    const response = await getMedicinesByUuids(uuids as string[]);
    const result = camelcaseKeys(response, {
      deep: true,
    }) as MedicineView[];
    return NextResponse.json({ result }, { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error fetching medicines by uuids",
        details: formatError(error),
      },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers,
    }
  );
}
