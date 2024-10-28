import { NextRequest, NextResponse } from "next/server";

import { confirmOrder } from "@/db/transactions";
import { formatError } from "@/utils/error-handlers";

export async function POST(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const result = await confirmOrder(params.uuid);
    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", details: formatError(error) },
      { status: 500 }
    );
  }
}
