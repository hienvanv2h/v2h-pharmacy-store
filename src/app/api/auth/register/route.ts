import { NextRequest, NextResponse } from "next/server";

import { formatError } from "@/utils/error-handlers";
import { generateUUID, hashPassword } from "@/lib/auth";
import { UserCreateDTO } from "@/types/user";
import {
  createCustomer,
  createUser,
  getCustomerByPhoneNumber,
  getUserByUsername,
} from "@/db/queries";
import { CustomerDTO } from "@/types/customer";

export async function POST(request: NextRequest) {
  const { username, password, name, address, phoneNumber } =
    await request.json();
  // Check required fields
  if (!username || !password || !name || !phoneNumber) {
    return NextResponse.json(
      { error: "Username, password, name and phone number are required" },
      { status: 400 }
    );
  }

  // Check if user already exists
  const user = await getUserByUsername(username);
  if (user) {
    return NextResponse.json(
      { error: "Username already exists" },
      { status: 400 }
    );
  }

  // Check if phone number already exists
  const customer = await getCustomerByPhoneNumber(phoneNumber);
  if (customer) {
    return NextResponse.json(
      { error: "Phone number already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = await hashPassword(password);
  const uuid = generateUUID();
  try {
    const userDto: UserCreateDTO = {
      uuid,
      username,
      password: hashedPassword,
    };
    const userCreateResponse = await createUser(userDto); // create new user
    const customerDto: CustomerDTO = {
      name,
      phoneNumber,
      email: username,
      address,
    };
    const customerCreateResponse = await createCustomer(customerDto); // create new customer

    if (userCreateResponse && customerCreateResponse) {
      return NextResponse.json(
        { message: "Registration successful" },
        { status: 200 }
      );
    } else {
      throw new Error("Failed to register");
    }
  } catch (error) {
    console.error("Failed to register:", error);
    return NextResponse.json(
      { error: "Failed to register", details: formatError(error) },
      { status: 500 }
    );
  }
}
