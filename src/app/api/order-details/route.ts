import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { OrderDetailView } from "@/types/order-detail";
import { getOrderDetailsByOrderUuid } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderUuid = searchParams.get("orderUuid") as string;
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    if (!orderUuid) {
      return NextResponse.json(
        { error: "Required parameter 'orderUuid' not found" },
        { status: 400 }
      );
    }

    if (
      isNaN(Number(page)) ||
      Number(page) < 0 ||
      isNaN(Number(limit)) ||
      Number(limit) < 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid parameters: page and limit must be positive numbers",
        },
        { status: 400 }
      );
    }

    const { data, totalItems } = await getOrderDetailsByOrderUuid(
      orderUuid,
      Number(page),
      Number(limit)
    );
    const result: OrderDetailView[] = camelcaseKeys(data, {
      deep: true,
    }) as OrderDetailView[];
    return NextResponse.json({ result, totalItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Error retrieving order details", details: formatError(error) },
      { status: 500 }
    );
  }
}
