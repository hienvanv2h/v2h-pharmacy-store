import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { OrderSummaryView } from "@/types/order";
import { getOrdersSummary } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";
import { createOrderAndDetailTransaction } from "@/db/transactions";

export async function POST(request: NextRequest) {
  try {
    const { orderDto, items } = await request.json();
    const response = await createOrderAndDetailTransaction(orderDto, items);
    if (response) {
      return NextResponse.json(
        { message: "Order created successfully" },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: "Order not created due to conflict or constraint" },
        { status: 409 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("out of stock")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error creating order", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
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
    const { data, totalItems } = await getOrdersSummary(
      Number(page),
      Number(limit)
    );
    const result: OrderSummaryView[] = camelcaseKeys(data, {
      deep: true,
    }) as OrderSummaryView[];
    return NextResponse.json({ result, totalItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching orders", details: formatError(error) },
      { status: 500 }
    );
  }
}
