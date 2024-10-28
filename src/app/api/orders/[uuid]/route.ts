import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import {
  getOrderByUuid,
  updateOrderByUuid,
  deleteOrderByUuid,
} from "@/db/queries";
import { OrderSummaryView, OrderDTO } from "@/types/order";
import { formatError } from "@/utils/error-handlers";

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const response = await getOrderByUuid(params.uuid);
    return NextResponse.json(
      { ...(camelcaseKeys(response, { deep: true }) as OrderSummaryView) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching order", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const data = (await request.json()) as OrderDTO;
    const response = await updateOrderByUuid(params.uuid, data);
    if (response) {
      return NextResponse.json(
        { message: "Order updated successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating order", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const response = await deleteOrderByUuid(params.uuid);
    if (response) {
      return NextResponse.json(
        { message: "Order deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting order", details: formatError(error) },
      { status: 500 }
    );
  }
}
