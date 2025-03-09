const express = require("express");
const router = express.Router();
const cartController = require("../controllers/Cart.controller");

// 📌 GET /carts - ดึงสินค้าทั้งหมดในตะกร้า
router.get("/", cartController.getAllCarts);

// 📌 POST /carts - เพิ่มสินค้าไปยังตะกร้า
router.post("/", cartController.createCart);

// 📌 DELETE /carts - ลบสินค้าทั้งหมดในตะกร้า
router.delete("/clear/:email", cartController.deleteAllCarts);

// 📌 GET /carts/:email - ดึงสินค้าทั้งหมดของผู้ใช้ตามอีเมล
router.get("/:email", cartController.getCartsByEmail);

// 📌 PUT /carts/:id - อัปเดตสินค้าตาม ID
router.put("/:id", cartController.updateCartById);

// 📌 DELETE /carts/:id - ลบสินค้าตาม ID
router.delete("/:id", cartController.deleteCartById);

module.exports = router;