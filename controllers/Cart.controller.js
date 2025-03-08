const CartModel = require("../models/Cart");

exports.createCart = async (req, res) => {
  const { productId, name, email, image, quantity, price } = req.body;
  if (!productId || !name || !email || !image || !quantity || !price) {
    return res.status(400).json({ message: "Product information is missing" });
  }
  try {
    //Existing item in out cart
    const existingItem = await CartModel.findOne({ productId, email });
    if (existingItem) {
      existingItem.quantity += quantity;
      const data = await existingItem.save();
      return res.send(data);
    }
    //add item to cart for the first timee
    const cart = new CartModel({
      productId,
      name,
      email,
      image,
      quantity,
      price,
    });
    const data = await cart.save();
    res.send(data);
  } catch (error) {
    res.status(500).json({
      message:
        error.message || "Something error occurred white adding new cart item",
    });
  }
};

exports.getAllCartItems = async (req, res) => {
  try {
    const cartItems = await CartModel.find();

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ message: "No cart items found" });
    }

    return res.json(cartItems);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong while getting cart items",
    });
  }
};

exports.getCartItemsByEmail = async (req, res) => {
  const { email } = req.params;
  if (!email) {
    res.status(400).json({ message: "Product information is missing" });
    return;
  }
  try {
    const cartItems = await CartModel.find({ email });
    if (!cartItems) {
      return res.status(404).json({ message: "No cart items found" });
    }
    return res.json(cartItems);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong while getting cart items",
    });
  }
};

exports.updateCartItem = async (req, res) => {
  const { id } = req.params;
  try {
    const cart = await CartModel.findByIdAndUpdate(id, req.body, {
      new: true,
      useFindAndModify: false,
    });
    if (!cart) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.json(cart);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong while updating cart item",
    });
  }
};

exports.deleteCartItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const cartItem = await CartModel.findByIdAndDelete(id);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.json({ message: "Cart item deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message:
        error.message || "Something went wrong while deleting cart item by id",
    });
  }
};

exports.clearCAllItem = async (req, res) => {
  const { email } = req.params;
  try {
    const cart = await CartModel.deleteMany({ email });
    if (cart.deletedCount === 0) {
      return res.status(404).json({ message: "cart cleared successfully" });
    }
    if (!cart) {
      return res.status(404).json({ message: "cart not found" });
    }
    res.status(200).json({ message: "Cart is Empty" });
  } catch (error) {
    return res.status(500).json({
      message:
        error.message ||
        "Something error occurred while clearing shopping cart",
    });
  }
};
