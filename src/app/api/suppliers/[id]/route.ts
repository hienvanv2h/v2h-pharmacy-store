import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { getSupplierById, updateSupplierById } from "@/db/queries";
import { Supplier, SupplierDTO } from "@/types/supplier";
import { formatError } from "@/utils/error-handlers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (Number(params.id) <= 0 || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }
    const response = await getSupplierById(Number(params.id));
    return NextResponse.json(
      { ...(camelcaseKeys(response, { deep: true }) as Supplier) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching suppliers", details: formatError(error) },
      { status: 500 }
    );
  }
}

// PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (Number(params.id) <= 0 || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }
    const data = (await request.json()) as SupplierDTO;
    const response = await updateSupplierById(Number(params.id), data);
    if (response) {
      return NextResponse.json(
        { message: "Supplier updated successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating supplier", details: formatError(error) },
      { status: 500 }
    );
  }
}

// DELETE not available - require admin provision to delete supplier
