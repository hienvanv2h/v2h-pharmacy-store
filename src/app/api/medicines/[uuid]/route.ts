import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { getMedicinesByUid, deleteMedicineByUid } from "@/db/queries";
import { MedicineView } from "@/types/medicine";
import { formatError } from "@/utils/error-handlers";
import { updateMedicineAndDetailTransaction } from "@/db/transactions";
import { apiHeaders } from "@/utils/apiHeaders";

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const response = await getMedicinesByUid(params.uuid);
    return NextResponse.json(
      { ...(camelcaseKeys(response, { deep: true }) as MedicineView) },
      { status: 200, headers: apiHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching medicines", details: formatError(error) },
      { status: 500, headers: apiHeaders }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  if (!params.uuid) {
    return NextResponse.json(
      { error: "Required parameter 'uuid' not found" },
      { status: 400, headers: apiHeaders }
    );
  }

  const { medicineDto, medicineDetailDto } = await request.json(); // medicineDetailsData is optional
  if (!medicineDto) {
    return NextResponse.json(
      { error: "Required medicine data not found" },
      { status: 400, headers: apiHeaders }
    );
  }

  try {
    const response = await updateMedicineAndDetailTransaction(
      params.uuid,
      medicineDto,
      medicineDetailDto
    );
    if (response) {
      return NextResponse.json(
        { message: "Medicine updated successfully" },
        { status: 200, headers: apiHeaders }
      );
    } else {
      return NextResponse.json({}, { status: 404, headers: apiHeaders });
    }
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: error.message },
        { status: 404, headers: apiHeaders }
      );
    }

    return NextResponse.json(
      { error: "Error updating medicine", details: formatError(error) },
      { status: 500, headers: apiHeaders }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    if (!params.uuid) {
      return NextResponse.json(
        { error: "Required parameter 'uuid' not found" },
        { status: 404, headers: apiHeaders }
      );
    }
    const response = await deleteMedicineByUid(params.uuid);
    if (response) {
      return NextResponse.json(
        { message: "Medicine deleted successfully" },
        { status: 200, headers: apiHeaders }
      );
    } else {
      return NextResponse.json(
        {
          error: "Medicine not found",
        },
        { status: 404, headers: apiHeaders }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting medicine", details: formatError(error) },
      { status: 500, headers: apiHeaders }
    );
  }
}
