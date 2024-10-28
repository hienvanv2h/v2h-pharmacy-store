import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";
import {
  getOrderDetailById,
  updateOrderDetailById,
  deleteOrderDetailById,
} from "@/db/queries";
import { OrderDetailView, OrderDetailDTO } from "@/types/order-detail";
import { formatError } from "@/utils/error-handlers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (Number(params.id) <= 0 || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid order detail ID" },
        { status: 400 }
      );
    }
    const response = await getOrderDetailById(Number(params.id));
    return NextResponse.json(camelcaseKeys(response) as OrderDetailView, {
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error getting order detail", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (Number(params.id) <= 0 || isNaN(Number(params.id))) {
      return NextResponse.json(
        { error: "Invalid order detail ID" },
        { status: 400 }
      );
    }
    const data = (await request.json()) as OrderDetailDTO;
    const response = await updateOrderDetailById(Number(params.id), data);
    if (response) {
      return NextResponse.json(
        { message: "Order detail updated successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Order detail not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating order detail", details: formatError(error) },
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
        { error: "Invalid order detail ID" },
        { status: 400 }
      );
    }
    const response = await deleteOrderDetailById(Number(params.id));
    if (response) {
      return NextResponse.json(
        { message: "Order detail deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Order detail not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting order detail", details: formatError(error) },
      { status: 500 }
    );
  }
}
