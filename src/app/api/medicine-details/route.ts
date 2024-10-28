import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { MedicineDetail, MedicineDetailDTO } from "@/types/medicine-detail";
import {
  createMedicineDetail,
  getMedicineDetailByMedicineUuid,
  updateMedicineDetailByMedicinesUuid,
} from "@/db/queries";
import { apiHeaders } from "@/utils/apiHeaders";
import { formatError } from "@/utils/error-handlers";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as MedicineDetailDTO;
    const response = await createMedicineDetail(data);
    if (response) {
      return NextResponse.json(
        { message: "Medicine detail created successfully" },
        { status: 201, headers: apiHeaders }
      );
    } else {
      return NextResponse.json(
        { error: "Medicine detail not created due to conflict or constraint" },
        { status: 409, headers: apiHeaders }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating medicine detail", details: formatError(error) },
      { status: 500, headers: apiHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const medicineUuid = searchParams.get("medicineUuid") as string; // find by medicine uuid
    if (!medicineUuid) {
      return NextResponse.json(
        { error: "Required parameter 'medicineUuid' not found" },
        { status: 400, headers: apiHeaders }
      );
    }

    const response = await getMedicineDetailByMedicineUuid(medicineUuid);
    return NextResponse.json(
      {
        ...(camelcaseKeys(response, { deep: true }) as MedicineDetail),
      },
      {
        status: 200,
        headers: apiHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching medicine details", details: formatError(error) },
      { status: 500, headers: apiHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const medicineUuid = searchParams.get("medicineUuid") as string; // update by medicine uuid
    if (!medicineUuid) {
      return NextResponse.json(
        { error: "Required parameter 'medicineUuid' not found" },
        { status: 400, headers: apiHeaders }
      );
    }

    const data = (await request.json()) as MedicineDetailDTO;
    const response = await updateMedicineDetailByMedicinesUuid(
      medicineUuid,
      data
    );
    if (response) {
      return NextResponse.json(
        { message: "Medicine detail updated successfully" },
        { status: 200, headers: apiHeaders }
      );
    } else {
      return NextResponse.json(
        { error: "Medicine detail not found" },
        { status: 404, headers: apiHeaders }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating medicine details", details: formatError(error) },
      { status: 500, headers: apiHeaders }
    );
  }
}
