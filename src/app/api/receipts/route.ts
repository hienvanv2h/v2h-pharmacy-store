import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { ReceiptView, isReceiptDTO } from "@/types/receipt";
import { getAllReceipts } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";
import { createBatchAndReceiptTransaction } from "@/db/transactions";
import { isMedicineBatchDTO } from "@/types/medicine-batch";

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

    const { data, totalItems } = await getAllReceipts(
      Number(page),
      Number(limit)
    );
    const result: ReceiptView[] = camelcaseKeys(data, {
      deep: true,
    }) as ReceiptView[];

    return NextResponse.json({ result, totalItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching medicines", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Insert both new batch and receipt
    const data = await request.json();
    const { medicineBatchDto, receiptDto } = data;
    if (
      !medicineBatchDto ||
      !receiptDto ||
      !isMedicineBatchDTO(medicineBatchDto) ||
      !isReceiptDTO(receiptDto)
    ) {
      return NextResponse.json(
        { error: "Missing medicine batch dto or receipt dto" },
        { status: 400 }
      );
    }

    const medicineUuid = medicineBatchDto.medicineUuid;
    if (!medicineUuid) {
      return NextResponse.json(
        { error: "Missing medicine uuid" },
        { status: 400 }
      );
    }

    const response = await createBatchAndReceiptTransaction(
      medicineUuid,
      medicineBatchDto,
      receiptDto
    );

    if (response) {
      return NextResponse.json(
        { message: "Receipt created successfully" },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: "Receipt not created due to conflict or constraint" },
        { status: 409 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating receipt", details: formatError(error) },
      { status: 500 }
    );
  }
}
