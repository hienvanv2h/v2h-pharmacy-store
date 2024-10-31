import pool from "./dbconnect";
import {
  sanitizeInput,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
} from "./helpers";
import { MedicineDTO } from "@/types/medicine";
import { ReceiptDTO } from "@/types/receipt";
import { SupplierDTO } from "@/types/supplier";
import { CustomerDTO } from "@/types/customer";
import { OrderDTO } from "@/types/order";
import { OrderDetailDTO } from "@/types/order-detail";
import { MedicineBatchDTO } from "@/types/medicine-batch";
import { PaymentDTO } from "@/types/payment";
import { CartDTO } from "@/types/cart";
import { UserCreateDTO, UserUpdateDTO } from "@/types/user";
import { SessionCreateDTO, SessionUpdateDTO } from "@/types/session";
import { MedicineDetailDTO } from "@/types/medicine-detail";
import { deprecate } from "util";
import { UserProfileDTO } from "@/types/user-profile";

// MEDICINES QUERIES

// Create both medicine and medicine detail in transaction (check transactions.ts)

export async function getAllMedicines(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."vw_medicines_with_uuid" ORDER BY "updated_at" DESC LIMIT $1 OFFSET $2`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."medicines"`;
  try {
    // Truy vấn song song
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [limit, offset]),
      pool.query(queryCount),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getAllMedcinesCategories() {
  const query = `SELECT DISTINCT "category" FROM "public"."medicines"`;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getAllMedicinesBrandName() {
  const query = `SELECT DISTINCT d."brand_name" AS "brandName"
    FROM medicine_details d
    WHERE d."brand_name" IS NOT NULL
    ORDER BY "brandName"`;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getAllMedicinesTags() {
  const query = `SELECT DISTINCT jsonb_array_elements_text("tags") AS "tag" FROM "medicines";`;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getMedicinesByUid(uuid: string) {
  const query = `SELECT * FROM "public"."vw_medicines_with_uuid" WHERE "uuid" = $1`;
  try {
    const result = await pool.query(query, [uuid]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getMedicinesByUuids(uuids: string[]) {
  const query = `SELECT * FROM "public"."vw_medicines_with_uuid" WHERE "uuid" = ANY($1::uuid[])`;
  try {
    const result = await pool.query(query, [uuids]);
    return result.rows;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getFilteredMedicines(
  filters: {
    categories?: string[];
    brandName?: string;
    keyword?: string;
  },
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;
  const sanitizedKeyword = filters.keyword
    ? `%${sanitizeInput(filters.keyword)}%`
    : null;

  const queryData = `SELECT * FROM "public"."vw_medicines_with_details"
    WHERE (COALESCE($1::VARCHAR[], ARRAY[]::VARCHAR[]) = ARRAY[]::VARCHAR[] OR "category" = ANY($1::VARCHAR[])) 
      AND ($2::VARCHAR IS NULL OR "brand_name" = $2::VARCHAR) 
      AND ($3::VARCHAR IS NULL OR "name" ILIKE $3::VARCHAR) 
    ORDER BY "updated_at" DESC LIMIT $4 OFFSET $5`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."vw_medicines_with_details" 
    WHERE (COALESCE($1::VARCHAR[], ARRAY[]::VARCHAR[]) = ARRAY[]::VARCHAR[] OR "category" = ANY($1::VARCHAR[])) 
      AND ($2::VARCHAR IS NULL OR "brand_name" = $2::VARCHAR) 
      AND ($3::VARCHAR IS NULL OR "name" ILIKE $3::VARCHAR)`;

  try {
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [
        filters.categories || null,
        filters.brandName || null,
        sanitizedKeyword,
        limit,
        offset,
      ]),
      pool.query(queryCount, [
        filters.categories || null,
        filters.brandName || null,
        sanitizedKeyword,
      ]),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getMedicinesContainsTags(
  tags: string[],
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."vw_medicines_with_uuid" WHERE "tags" @> $1::jsonb ORDER BY "updated_at" DESC LIMIT $2 OFFSET $3`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."medicines" WHERE "tags" @> $1::jsonb`;
  try {
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [JSON.stringify(tags), limit, offset]),
      pool.query(queryCount, [JSON.stringify(tags)]),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// Update both medicines and medicine_details at the same time in one transaction (check transactions.ts)

export async function deleteMedicineByUid(
  uuid: string
): Promise<boolean | null> {
  const query = buildDeleteQuery("medicines");
  try {
    const result = await pool.query(query, [uuid]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// MEDICINE DETAILS QUERIES
export async function createMedicineDetail(
  medicineDetailDto: Partial<MedicineDetailDTO>
): Promise<boolean | null> {
  const query = buildInsertQuery("medicine_details", medicineDetailDto);
  try {
    const result = await pool.query(query, [
      ...Object.values(medicineDetailDto),
    ]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getMedicineDetailByMedicineUuid(medicineUuid: string) {
  const query = `SELECT * FROM "public"."medicine_details" WHERE "medicine_uuid" = $1 ORDER BY "updated_at" DESC`;
  try {
    const result = await pool.query(query, [medicineUuid]);
    return result.rows[0]; // Only get the first row of the result
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getMedicineDetailViewByUuid(uuid: string) {
  const query = `SELECT * FROM "public"."vw_medicines_with_details" WHERE "uuid" = $1`;
  try {
    const result = await pool.query(query, [uuid]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateMedicineDetailByMedicinesUuid(
  medicinesUuid: string,
  medicineDetailDto: Partial<MedicineDetailDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("medicine_details", medicineDetailDto, {
    findBy: "medicine_uuid",
  });
  try {
    const result = await pool.query(query, [
      ...Object.values(medicineDetailDto),
      medicinesUuid,
    ]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// MEDICNE IMAGES QUERIES
export async function createMedicineImage(
  medicineUuid: string,
  imageUrl: string
): Promise<boolean | null> {
  const query = `INSERT INTO "public"."medicine_images" ("medicine_uuid", "image_url") VALUES ($1, $2)`;
  try {
    const result = await pool.query(query, [medicineUuid, imageUrl]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getMedicinesImagesByMedicinesUuid(medicineUuid: string) {
  const query = `SELECT * FROM "public"."medicine_images" WHERE "medicine_uuid" = $1 ORDER BY "updated_at" DESC`;
  try {
    const result = await pool.query(query, [medicineUuid]);
    return result.rows;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// MEDICINE BATCHES QUERIES

// Medicine batches will be created with receipt in transaction (check transactions.ts)

export async function getMedicinesBatchesByMedicinesUuid(
  medicineUuid: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."medicine_batches" WHERE "medicine_uuid" = $1 ORDER BY "updated_at" DESC LIMIT $2 OFFSET $3`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."medicine_batches" WHERE "medicine_uuid" = $1`;
  try {
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [medicineUuid, limit, offset]),
      pool.query(queryCount, [medicineUuid]),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getTotalQuantityByMedicinesUuid(medicineUuid: string) {
  const query = `SELECT SUM("quantity") AS "totalQuantity" FROM "public"."medicine_batches" WHERE "medicine_uuid" = $1`;
  try {
    const result = await pool.query(query, [medicineUuid]);
    const totalQuantity = parseInt(result.rows[0].totalQuantity, 10);
    return { totalQuantity: !isNaN(totalQuantity) ? totalQuantity : 0 };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateMedicinesBatchesById(
  id: number,
  medicineBatchDto: Partial<MedicineBatchDTO>
) {
  const query = buildUpdateQuery("medicine_batches", medicineBatchDto, {
    findBy: "batch_id",
  });
  try {
    const result = await pool.query(query, [
      ...Object.values(medicineBatchDto),
      id,
    ]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function deleteMedicinesBatchesById(id: number) {
  const query = buildDeleteQuery("medicine_batches", { findBy: "batch_id" });
  try {
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// RECEIPTS QUERIES
export async function createReceipt(
  receiptDto: ReceiptDTO
): Promise<boolean | null> {
  const query = buildInsertQuery("receipts", receiptDto);
  try {
    const result = await pool.query(query, [...Object.values(receiptDto)]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getAllReceipts(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."vw_receipts_with_uuid" ORDER BY "updated_at" DESC LIMIT $1 OFFSET $2`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."receipts"`;
  try {
    // Truy vấn song song
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [limit, offset]),
      pool.query(queryCount),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getReceiptByUuid(uuid: string) {
  const query = `SELECT * FROM "public"."vw_receipts_with_uuid" WHERE "uuid" = $1`;
  try {
    const result = await pool.query(query, [uuid]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateReceiptByUuid(
  uuid: string,
  receiptDto: Partial<ReceiptDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("receipts", receiptDto);
  try {
    const result = await pool.query(query, [
      ...Object.values(receiptDto),
      uuid,
    ]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function deleteReceiptByUuid(
  uuid: string
): Promise<boolean | null> {
  const query = buildDeleteQuery("receipts");
  try {
    const result = await pool.query(query, [uuid]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// SUPPLIERS QUERIES
export async function createSupplier(
  supplierDto: SupplierDTO
): Promise<boolean | null> {
  const query = buildInsertQuery("suppliers", supplierDto);
  try {
    const result = await pool.query(query, [...Object.values(supplierDto)]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getAllSuppliers(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."suppliers" ORDER BY "updated_at" DESC LIMIT $1 OFFSET $2`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."suppliers"`;
  try {
    // Truy vấn song song
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [limit, offset]),
      pool.query(queryCount),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getSupplierById(id: number) {
  const query = `SELECT * FROM "public"."suppliers" WHERE "supplier_id" = $1`;
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateSupplierById(
  id: number,
  supplierDto: Partial<SupplierDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("suppliers", supplierDto, {
    findBy: "supplier_id",
  });
  try {
    const result = await pool.query(query, [...Object.values(supplierDto), id]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// CUSTOMERS QUERIES
export async function createCustomer(
  customerDto: CustomerDTO
): Promise<boolean | null> {
  const query = buildInsertQuery("customers", customerDto);
  try {
    const result = await pool.query(query, [...Object.values(customerDto)]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getAllCustomers(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."customers" ORDER BY "updated_at" DESC LIMIT $1 OFFSET $2`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."customers"`;
  try {
    // Truy vấn song song
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [limit, offset]),
      pool.query(queryCount),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getCustomerById(id: number) {
  const query = `SELECT * FROM "public"."customers" WHERE "customer_id" = $1`;
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getCustomerByPhoneNumber(phoneNumber: string) {
  const query = `SELECT * FROM "public"."customers" WHERE "phone_number" = $1`;
  try {
    const result = await pool.query(query, [phoneNumber]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getCustomerByEmailAndPhoneNumber(
  email: string,
  phoneNumber: string
) {
  const query = `SELECT * FROM "public"."customers" 
    WHERE ($1::VARCHAR IS NULL OR $1::VARCHAR = '' OR "email" = $1) 
    AND ($2::VARCHAR IS NULL OR $2::VARCHAR = '' OR "phone_number" = $2)`;
  try {
    const result = await pool.query(query, [email, phoneNumber]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateCustomerById(
  id: number,
  customerDto: Partial<CustomerDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("customers", customerDto, {
    findBy: "customer_id",
  });
  try {
    const result = await pool.query(query, [...Object.values(customerDto), id]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// CARTS QUERIES
export async function createOrUpdateCart(cartDto: CartDTO) {
  const query = `
    INSERT INTO "public"."carts" ("user_uuid", "items")
    VALUES ($1, $2::jsonb)
    ON CONFLICT ("user_uuid")
    DO UPDATE SET "items" = $2::jsonb, 
    "updated_at" = CURRENT_TIMESTAMP
    RETURNING *
  `;
  try {
    const { userUuid, items } = cartDto;
    const result = await pool.query(query, [userUuid, JSON.stringify(items)]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getAllCarts(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."carts" ORDER BY "updated_at" DESC LIMIT $1 OFFSET $2`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."carts"`;
  try {
    // Truy vấn song song
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [limit, offset]),
      pool.query(queryCount),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getCartByUserUuid(userUuid: string) {
  const query = `SELECT * FROM "public"."carts" WHERE "user_uuid" = $1`;
  try {
    const result = await pool.query(query, [userUuid]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// ORDERS QUERIES

// Create order and order detail in transaction (check transactions.ts)

export async function getOrdersSummary(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."vw_order_summary" ORDER BY "updated_at" DESC LIMIT $1 OFFSET $2`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."vw_order_summary"`;
  try {
    // Truy vấn song song
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [limit, offset]),
      pool.query(queryCount),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getOrderByUuid(uuid: string) {
  const query = `SELECT * FROM "public"."vw_order_summary" WHERE "uuid" = $1`;
  try {
    const result = await pool.query(query, [uuid]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateOrderByUuid(
  uuid: string,
  orderDto: Partial<OrderDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("orders", orderDto);
  try {
    const result = await pool.query(query, [...Object.values(orderDto), uuid]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function deleteOrderByUuid(uuid: string): Promise<boolean | null> {
  const query = buildDeleteQuery("orders");
  try {
    const result = await pool.query(query, [uuid]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// ORDERS DETAILS QUERIES

// Create order and order detail in transaction (check transactions.ts)

export async function getOrderDetailsByOrderUuid(
  orderUuid: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;
  const queryData = `SELECT * FROM "public"."vw_order_details" WHERE "order_uuid" = $1 ORDER BY "updated_at" DESC LIMIT $2 OFFSET $3`;
  const queryCount = `SELECT COUNT(*) AS "totalItems" FROM "public"."vw_order_details" WHERE "order_uuid" = $1`;
  try {
    const [resultData, resultCount] = await Promise.all([
      pool.query(queryData, [orderUuid, limit, offset]),
      pool.query(queryCount, [orderUuid]),
    ]);
    const data = resultData.rows;
    const totalItems = parseInt(resultCount.rows[0].totalItems, 10);
    return { data, totalItems };
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getOrderDetailById(id: number) {
  const query = `SELECT * FROM "public"."vw_order_details" WHERE "order_detail_id" = $1`;
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateOrderDetailById(
  id: number,
  orderDetailDto: Partial<OrderDetailDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("order_details", orderDetailDto, {
    findBy: "order_detail_id",
  });
  try {
    const result = await pool.query(query, [
      ...Object.values(orderDetailDto),
      id,
    ]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function deleteOrderDetailById(
  id: number
): Promise<boolean | null> {
  const query = buildDeleteQuery("order_details", {
    findBy: "order_detail_id",
  });
  try {
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// PAYMENTS QUERIES
export async function createPayment(
  paymentDto: PaymentDTO
): Promise<boolean | null> {
  const query = buildInsertQuery("payments", paymentDto);
  try {
    const result = await pool.query(query, [...Object.values(paymentDto)]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getPaymentByOrderUuid(orderUuid: string) {
  const query = `SELECT * FROM "public"."payments" WHERE "order_uuid" = $1`;
  try {
    const result = await pool.query(query, [orderUuid]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// USERS QUERIES

// Create both user and user profile in transaction (check transactions.ts)

export async function getUserByUserUuid(uuid: string) {
  const query = `SELECT * FROM "public"."vw_users_with_uuid" WHERE "uuid" = $1`;
  try {
    const result = await pool.query(query, [uuid]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getUserByUsername(username: string) {
  const query = `SELECT * FROM "public"."vw_users_with_uuid" WHERE "username" = $1`;
  try {
    const result = await pool.query(query, [username]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateUserByUserUuid(
  uuid: string,
  userDto: Partial<UserUpdateDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("users", userDto);
  try {
    const result = await pool.query(query, [...Object.values(userDto), uuid]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// USER PROFILE QUERIES
export async function getUserProfileViewByUserUuid(userUuid: string) {
  const query = `SELECT * FROM "public"."vw_user_profiles_view" WHERE "user_uuid" = $1`;
  try {
    const result = await pool.query(query, [userUuid]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateUserProfileByUserUuid(
  userUuid: string,
  userProfileDto: Partial<UserProfileDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("user_profiles", userProfileDto, {
    findBy: "user_uuid",
  });
  try {
    const result = await pool.query(query, [
      ...Object.values(userProfileDto),
      userUuid,
    ]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

// SESSIONS QUERIES
export async function createSession(
  sessionDto: SessionCreateDTO
): Promise<boolean | null> {
  const query = buildInsertQuery("sessions", sessionDto);
  try {
    const result = await pool.query(query, [...Object.values(sessionDto)]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function getSessionByToken(token: string) {
  const query = `SELECT * FROM "public"."sessions" WHERE "token" = $1 AND "expires_at" > NOW()`;
  try {
    const result = await pool.query(query, [token]);
    return result.rows[0];
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}

export async function updateSessionByToken(
  token: string,
  sessionDto: Partial<SessionUpdateDTO>
): Promise<boolean | null> {
  const query = buildUpdateQuery("sessions", sessionDto, {
    findBy: "token",
  });
  try {
    const result = await pool.query(query, [
      ...Object.values(sessionDto),
      token,
    ]);
    return result.rowCount > 0;
  } catch (err: any) {
    console.error("Database error:", err);
    throw err;
  }
}
