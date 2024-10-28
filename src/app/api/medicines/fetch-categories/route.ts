import { NextRequest, NextResponse } from "next/server";

import { getAllMedcinesCategories } from "@/db/queries";
import { formatError } from "@/utils/error-handlers";

export async function GET(request: NextRequest) {
  try {
    const response = await getAllMedcinesCategories();
    let categories: string[] = [];
    response.map((categoryObj: any) => {
      categories.push(categoryObj.category);
    });

    return NextResponse.json(categories, {
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching categories", details: formatError(error) },
      { status: 500 }
    );
  }
}
