import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import {
  createMedicineImage,
  getMedicinesImagesByMedicinesUuid,
} from "@/db/queries";
import { MedicineImage, MedicineImageDTO } from "@/types/medicines-image";
import { formatError } from "@/utils/error-handlers";

export async function POST(request: NextRequest) {
  try {
    const { medicineUuid, imageUrl } =
      (await request.json()) as MedicineImageDTO;
    const response = await createMedicineImage(medicineUuid, imageUrl);
    if (response) {
      return NextResponse.json(
        { message: "Image uploaded successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Image not uploaded due to conflict or constraint" },
        { status: 409 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error uploading image", details: formatError(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const medicineUuid = searchParams.get("medicineUuid") as string;
    const response = await getMedicinesImagesByMedicinesUuid(medicineUuid);
    return NextResponse.json(
      camelcaseKeys(response, {
        deep: true,
      }) as MedicineImage[],
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching images", details: formatError(error) },
      { status: 500 }
    );
  }
}
