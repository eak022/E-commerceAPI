const express = require("express");
const router = express.Router();
const orderController = require("../controllers/Order.controller");

router.get("/", orderController.getAllOrder);

router.get("/:id", orderController.getOrderById);

router.put("/:id", orderController.updateOrderDetail);
router.delete("/:id", orderController.deleteOrder);

module.exports = router;
