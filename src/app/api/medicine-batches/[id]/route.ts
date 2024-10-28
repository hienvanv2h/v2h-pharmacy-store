import { NextRequest, NextResponse } from "next/server";
import { MedicineBatchDTO } from "@/types/medicine-batch";
import {
  deleteMedicinesBatchesById,
  updateMedicinesBatchesById,
} from "@/db/queries";
import { formatError } from "@/utils/error-handlers";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (Number(params.id) <= 0 || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid medicine batch ID" },
        { status: 400 }
      );
    }
    const data = (await request.json()) as MedicineBatchDTO;
    const response = await updateMedicinesBatchesById(Number(params.id), data);
    if (response) {
      return NextResponse.json(
        { message: "Medicine batch updated successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Medicine batch not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating medicine batch", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (Number(params.id) <= 0 || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid medicine batch ID" },
        { status: 400 }
      );
    }
    const response = await deleteMedicinesBatchesById(Number(params.id));
    if (response) {
      return NextResponse.json(
        { message: "Medicine batch deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Medicine batch not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting medicine batch", details: formatError(error) },
      { status: 500 }
    );
  }
}
