import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { SupplierDTO, Supplier } from "@/types/supplier";
import { createSupplier, getAllSuppliers } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as SupplierDTO;
    const response = await createSupplier(data);
    if (response) {
      return NextResponse.json(
        { message: "Supplier created successfully" },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: "Supplier not created due to conflict or constraint" },
        { status: 409 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating supplier", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";
  try {
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

    const { data, totalItems } = await getAllSuppliers(
      Number(page),
      Number(limit)
    );
    const result: Supplier[] =
      (camelcaseKeys(data, { deep: true }) as Supplier[]) || [];
    return NextResponse.json({ result, totalItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching suppliers", details: formatError(error) },
      { status: 500 }
    );
  }
}
