const OrderModel = require("../models/Order");
const ProductModel = require("../models/Product"); // Import Product Model
exports.getOrder = async (req, res) => {
  /**
     #swagger.tags = ['Order']
     #swagger.summary = "Get all Orders"
     #swagger.description = 'Endpoint to get all orders with product details'
  */
  try {
    const order = await OrderModel.find().populate("products.productId"); // ใช้ populate เพื่อดึงข้อมูลสินค้า จาก ProductModel มาแสดง ใน OrderModel  ด้วย ref ที่เราได้กำหนดไว้ ใน OrderModel
    res.json(order);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving orders" });
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const orderDoc = await OrderModel.findById(id);
    if (!orderDoc) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(orderDoc);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    res
      .status(500)
      .json({ message: "An error occurred while fetching order details" });
  }
};


exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const orderDoc = await OrderModel.findById(id);

    if (!orderDoc) {
      return res.status(404).send({
        message: "Order not found",
      });
    }

    await OrderModel.findByIdAndDelete(id);

    res.status(200).send({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error.message);
    res.status(500).send({
      message: error.message || "An error occurred while deleting the order",
    });
  }
};

exports.updateOrderDetail = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ message: "id is require" });
  }
  try {
    const orderDetail = await OrderModel.findById(id);
    if (!orderDetail) {
      return res.status(404).json({ message: "Order not found" });
    }
    const { delivery_status } = req.body;
    if (!delivery_status) {
      return res.status(400).json({ message: "deliver_status is require" });
    }
    orderDetail.delivery_status = delivery_status;
    await orderDetail.save();
    res.json(orderDetail);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      message: "Something error occurred while Updating order detail",
    });
  }
};
