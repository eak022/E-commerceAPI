const express = require("express");
const router = express.Router();
const cartController = require("../controllers/Cart.controller");

router.post("/", cartController.createCart);
router.get("/", cartController.getAllCartItems);
router.get("/:email", cartController.getCartItemsByEmail);
router.put("/:id", cartController.updateCartItem);
router.delete("/:id", cartController.deleteCartItemById);
router.delete("/clear/:email", cartController.clearCAllItem);
module.exports = router;
