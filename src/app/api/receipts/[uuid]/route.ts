import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import {
  deleteReceiptByUuid,
  getReceiptByUuid,
  updateReceiptByUuid,
} from "@/db/queries";
import { ReceiptView, ReceiptDTO } from "@/types/receipt";
import { formatError } from "@/utils/error-handlers";

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const response = await getReceiptByUuid(params.uuid);
    return NextResponse.json(
      { ...(camelcaseKeys(response, { deep: true }) as ReceiptView) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching medicines", details: formatError(error) },
      { status: 500 }
    );
  }
}

// TODO: Implement PUT and DELETE route
export async function PUT(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const data = (await request.json()) as ReceiptDTO;
    console.log(data);
    const response = await updateReceiptByUuid(params.uuid, data);
    if (response) {
      return NextResponse.json(
        { message: "Receipt updated successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating receipt", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const response = await deleteReceiptByUuid(params.uuid);
    if (response) {
      return NextResponse.json(
        { message: "Receipt deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          error: "Receipt not found",
        },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting receipt", details: formatError(error) },
      { status: 500 }
    );
  }
}
