import { NextRequest, NextResponse } from "next/server";
import camelcaseKeys from "camelcase-keys";

import { formatError } from "@/utils/error-handlers";
import { createOrUpdateCart, getCartByUserUuid } from "@/db/queries";
import { Cart, CartDTO } from "@/types/cart";
import { decrypt, getSessionToken } from "@/lib/auth";
import { TokenPayload } from "@/types/token-payload";

/**
 * Fetches the cart for the current user (session token required).
 *
 * @param request The incoming NextRequest
 *
 * @returns The cart as a JSON response
 */
export async function GET(request: NextRequest) {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const payload = (await decrypt(token)) as TokenPayload;
    const cart = await getCartByUserUuid(payload.uuid);
    return NextResponse.json(
      { ...(camelcaseKeys(cart, { deep: true }) as Cart) },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching cart", details: formatError(error) },
      { status: 500 }
    );
  }
}

/**
 * Creates or updates the cart for the current user (session token required).
 *
 * @param request The incoming NextRequest
 *
 * @returns The created or updated cart as a JSON response
 */
export async function POST(request: NextRequest) {
  const token = getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const payload = (await decrypt(token)) as TokenPayload;
    const { items } = await request.json();

    const cartDto: CartDTO = {
      userUuid: payload.uuid,
      items,
    };
    const result = await createOrUpdateCart(cartDto);
    return NextResponse.json(
      { ...camelcaseKeys(result, { deep: true }) },
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating cart", details: formatError(error) },
      { status: 500 }
    );
  }
}
