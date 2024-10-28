import "server-only";

import pool from "./dbconnect";

import { MedicineDTO } from "@/types/medicine";
import { MedicineDetailDTO } from "@/types/medicine-detail";
import { buildInsertQuery, buildUpdateQuery } from "./helpers";
import { MedicineImageDTO } from "@/types/medicines-image";
import { MedicineBatchDTO } from "@/types/medicine-batch";
import { ReceiptDTO } from "@/types/receipt";
import { OrderDTO } from "@/types/order";

// MEDICINES & MEDICINE DETAILS TRANSACTIONS

export async function createMedicineAndDetailTransaction(
  medicineDto: MedicineDTO,
  medicineDetailDto: Partial<MedicineDetailDTO>
): Promise<boolean> {
  const client = await pool.connect();
  try {
    console.log("Starting transaction...");
    await client.query("BEGIN");

    // Create new medicine
    const insertMedicineQuery = buildInsertQuery("medicines", medicineDto);
    const medicineValues = Object.values(medicineDto).map((value) =>
      Array.isArray(value) || typeof value === "object"
        ? JSON.stringify(value)
        : value
    );
    const medicineResult = await client.query(
      insertMedicineQuery,
      medicineValues
    );

    if (medicineResult.rowCount === 0) {
      throw new Error("Failed to insert medicine");
    }

    // Get inserted medicine UUID
    const medicineUuid = medicineResult.rows[0].uuid;

    // Update medicine details with inserted UUID
    const medicineDetailsWithUUID = {
      ...medicineDetailDto,
      medicine_uuid: medicineUuid,
    };

    // Create new medicine details
    const insertMedicineDetailsQuery = buildInsertQuery(
      "medicine_details",
      medicineDetailsWithUUID
    );
    const medicineDetailsValues = Object.values(medicineDetailsWithUUID).map(
      (value) =>
        Array.isArray(value) || typeof value === "object"
          ? JSON.stringify(value)
          : value
    );
    const medicineDetailsResult = await client.query(
      insertMedicineDetailsQuery,
      medicineDetailsValues
    );

    if (medicineDetailsResult.rowCount === 0) {
      throw new Error("Failed to insert medicine details");
    }

    // Insert into medicine_images if thumbnail_url exists
    if (medicineDto.thumbnailUrl) {
      const medicineImageWithUUID: MedicineImageDTO = {
        medicineUuid: medicineUuid,
        imageUrl: medicineDto.thumbnailUrl,
      };
      const medicineImageQuery = buildInsertQuery(
        "medicine_images",
        medicineImageWithUUID
      );
      const medicineImageResult = await client.query(medicineImageQuery, [
        ...Object.values(medicineImageWithUUID),
      ]);

      if (medicineImageResult.rowCount === 0) {
        throw new Error("Failed to insert medicine image");
      }
    }

    await client.query("COMMIT");
    console.log("Transaction completed successfully!");
    return true;
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Transaction error:", error);
    throw error;
  } finally {
    client.release(); // release the connection
  }
}

export async function updateMedicineAndDetailTransaction(
  medicineUuid: string,
  medicineDto: Partial<MedicineDTO>,
  medicineDetailDto?: Partial<MedicineDetailDTO>
): Promise<boolean> {
  const client = await pool.connect();

  try {
    console.log(`Starting transaction for medicine ${medicineUuid}`);
    await client.query("BEGIN");

    // Update medicine
    const medicineQuery = buildUpdateQuery("medicines", medicineDto);
    const medicineResult = await client.query(medicineQuery, [
      ...Object.values(medicineDto).map((value) => {
        return Array.isArray(value) || typeof value === "object"
          ? JSON.stringify(value)
          : value;
      }),
      medicineUuid,
    ]);

    if (medicineResult.rowCount === 0) {
      throw new Error("Medicine not found");
    }

    // Update details if provided
    if (medicineDetailDto) {
      const detailsQuery = buildUpdateQuery(
        "medicine_details",
        medicineDetailDto,
        {
          findBy: "medicine_uuid",
        }
      );
      const detailsResult = await client.query(detailsQuery, [
        ...Object.values(medicineDetailDto),
        medicineUuid,
      ]);

      if (detailsResult.rowCount === 0) {
        throw new Error("Medicine details not found");
      }
    }

    // Update or insert into medicine_images if thumbnail_url is provided
    if (medicineDto.thumbnailUrl) {
      const medicineImageWithUUID: MedicineImageDTO = {
        medicineUuid: medicineUuid,
        imageUrl: medicineDto.thumbnailUrl,
      };

      const medicineImageQuery = `
        INSERT INTO "public"."medicine_images" ("medicine_uuid", "image_url")
        VALUES ($1, $2)
      `;

      const medicineImageResult = await client.query(medicineImageQuery, [
        ...Object.values(medicineImageWithUUID),
      ]);

      if (medicineImageResult.rowCount === 0) {
        throw new Error("Failed to update or insert medicine image");
      }
    }

    await client.query("COMMIT");
    console.log(
      `Transaction completed successfully for medicine ${medicineUuid}`
    );
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Transaction failed for medicine ${medicineUuid}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// MEDICINE BATCHES & RECEIPTS
export async function createBatchAndReceiptTransaction(
  medicineUuid: string,
  batchDto: Partial<MedicineBatchDTO>,
  receiptDto: Partial<ReceiptDTO>
): Promise<boolean> {
  const client = await pool.connect();

  try {
    console.log(
      `Starting transaction for medicine batch and receipt creation...`
    );
    await client.query("BEGIN");

    // Step 1: Insert/Update batch record
    const batchQuery = `
      INSERT INTO medicine_batches (medicine_uuid, expiration_date, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (medicine_uuid, expiration_date) 
      DO UPDATE SET quantity = medicine_batches.quantity + EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP
      RETURNING batch_id
    `;
    const { expirationDate, quantity: batchQuantity } = batchDto;
    const batchResult = await client.query(batchQuery, [
      medicineUuid,
      expirationDate,
      batchQuantity,
    ]);

    if (batchResult.rowCount === 0) {
      throw new Error("Failed to insert or update batch");
    }

    const batchId = batchResult.rows[0].batch_id;

    // Step 2: Insert receipt record
    const receiptQuery = `
      INSERT INTO receipts (uuid, supplier_id, batch_id, quantity, price, created_by)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      RETURNING receipt_id
    `;
    const {
      supplierId,
      quantity: receiptQuantity,
      price,
      createdBy,
    } = receiptDto;
    const receiptResult = await client.query(receiptQuery, [
      supplierId,
      batchId,
      receiptQuantity,
      price,
      createdBy,
    ]);

    if (receiptResult.rowCount === 0) {
      throw new Error("Failed to insert receipt");
    }

    await client.query("COMMIT");
    console.log(
      `Transaction completed successfully for medicine batch and receipt creation.`
    );
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(
      `Transaction failed for medicine batch and receipt creation:`,
      error
    );
    throw error;
  } finally {
    client.release();
  }
}

// ORDER & ORDER DETAILS
export async function createOrderAndDetailTransaction(
  orderDto: Partial<OrderDTO>,
  items: { medicineUuid: string; quantity: number }[]
) {
  const client = await pool.connect();
  try {
    console.log("Starting transaction for order and order detail creation...");
    await client.query("BEGIN");

    // 1. Create new order
    const insertOrderQuery = `
      INSERT INTO orders (customer_id, status)
      VALUES ($1, $2)
      RETURNING uuid
    `;
    const { customerId, status } = orderDto;
    const orderResult = await client.query(insertOrderQuery, [
      customerId,
      status || "Pending",
    ]);

    if (orderResult.rowCount === 0) {
      throw new Error("Failed to insert order");
    }

    const orderUuid = orderResult.rows[0].uuid;

    // 2. Check items exist
    for (const item of items) {
      const { medicineUuid, quantity } = item;
      // Check availability in medicine batches
      const selectBatchQuery = `
        SELECT batch_id, quantity
        FROM medicine_batches
        WHERE medicine_uuid = $1 AND quantity >= $2 AND expiration_date >= CURRENT_DATE
        ORDER BY expiration_date ASC
        LIMIT 1
      `;
      const batchResult = await client.query(selectBatchQuery, [
        medicineUuid,
        quantity,
      ]);

      if (batchResult.rowCount === 0) {
        throw new Error(`Medicine ${medicineUuid} is out of stock.`);
      }

      const batch = batchResult.rows[0];

      // Calculate total price
      const priceResult = await client.query(
        `SELECT price FROM medicines WHERE uuid = $1`,
        [medicineUuid]
      );

      const price = priceResult.rows[0].price;

      // Create new order detail
      const insertOrderDetailQuery = `
        INSERT INTO order_details (order_uuid, medicine_uuid, medicine_batch_id, quantity, price)
        VALUES ($1, $2, $3, $4, $5)
      `;
      const orderDetailResult = await client.query(insertOrderDetailQuery, [
        orderUuid,
        medicineUuid,
        batch.batch_id,
        quantity,
        price,
      ]);

      if (orderDetailResult.rowCount === 0) {
        throw new Error("Failed to insert order detail");
      }

      // Update batch quantity
      const updateBatchQuery = `
        UPDATE medicine_batches
        SET quantity = quantity - $1
        WHERE batch_id = $2
      `;
      const updateBatchResult = await client.query(updateBatchQuery, [
        quantity,
        batch.batch_id,
      ]);

      if (updateBatchResult.rowCount === 0) {
        throw new Error("Failed to update batch quantity");
      }
    }

    await client.query("COMMIT");
    console.log(
      "Transaction completed successfully for order and order detail creation."
    );
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Confirm an order
// export async function confirmOrder(orderUuid: string) {
//   const client = await pool.connect();
//   try {
//     await client.query("BEGIN"); // Bắt đầu transaction

//     // 1. Update order status to 'Confirmed'
//     const updateOrderQuery = `
//       UPDATE orders
//       SET status = 'Confirmed', updated_at = CURRENT_TIMESTAMP
//       WHERE uuid = $1
//     `;
//     await client.query(updateOrderQuery, [orderUuid]);

//     // 2. Lấy chi tiết đơn hàng từ bảng order_details để cập nhật các medicine_batches
//     const getOrderDetailsQuery = `
//       SELECT medicine_batch_id, quantity
//       FROM order_details
//       WHERE order_uuid = $1
//     `;
//     const orderDetails = await client.query(getOrderDetailsQuery, [orderUuid]);

//     // 3. Cập nhật số lượng trong bảng medicine_batches
//     const updateBatchQuery = `
//       UPDATE medicine_batches
//       SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
//       WHERE batch_id = $2 AND quantity >= $1
//     `;

//     for (const detail of orderDetails.rows) {
//       const { medicine_batch_id, quantity } = detail;

//       const result = await client.query(updateBatchQuery, [
//         quantity,
//         medicine_batch_id,
//       ]);

//       // Kiểm tra nếu không có batch nào được cập nhật (không đủ số lượng)
//       if (result.rowCount === 0) {
//         throw new Error(`Insufficient quantity in batch ${medicine_batch_id}`);
//       }
//     }

//     // Commit transaction nếu mọi thứ thành công
//     await client.query("COMMIT");
//     return { success: true, message: "Order confirmed successfully" };
//   } catch (err: any) {
//     await client.query("ROLLBACK"); // Rollback nếu có lỗi
//     console.error("Transaction failed, rolling back changes:", err);
//     return {
//       success: false,
//       message: `Failed to confirm order: ${err.message}`,
//     };
//   } finally {
//     client.release(); // Giải phóng client
//   }
// }
