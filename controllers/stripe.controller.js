const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const OrderModel = require("../models/Order");
const CartModel = require("../models/Cart");

exports.createCheckOutSession = async (req, res) => {
  const cartItems = req.body.cart;
  const products = cartItems.map((item) => {
    return {
      productId: item.productId,  // ✅ เพิ่ม productId
      image: item.image,          // ✅ เพิ่ม image
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,   
    };
  });
  //customer info
  const customer = await stripe.customers.create({
    metadata: {
      email: req.body.email.toString(),
      cart: JSON.stringify(products), // Metadata จะบันทึก productName
    },
  });

  const line_items = cartItems.map((item) => {
    return {
      price_data: {
        currency: "thb",
        product_data: {
          name: item.name,
          images: [item.image],
          description: item.name,
          metadata: {
            id: item.productId,
          },
        },
        unit_amount: item.price * 100, // THB to cent
      },
      quantity: item.quantity, // Quantity of the item
    };
  });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "promptpay"],
    shipping_address_collection: {
      allowed_countries: ["TH"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "thb",
          },
          display_name: "Free shipping",
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 5,
            },
            maximum: {
              unit: "business_day",
              value: 7,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 4500,
            currency: "thb",
          },
          display_name: "Next day air",
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 1,
            },
          },
        },
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
    line_items,
    customer: customer.id,
    mode: "payment",
    success_url: `${process.env.PRODUCTION_FRONTEND_URL}/checkout-success`,
    cancel_url: `${process.env.PRODUCTION_FRONTEND_URL}/cart`,
  });
  
  console.log("Success URL:", `${process.env.PRODUCTION_FRONTEND_URL}/checkout-success`);
  console.log("Cancel URL:", `${process.env.PRODUCTION_FRONTEND_URL}/cart`);
  console.log("Session:", session);

  res.send({ url: session.url });
};

const clearCart = async (email) => {
  try {
    await CartModel.deleteMany({ email });
    console.log("Cart Cleared successfully for email:", email);
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw new Error(error.message || "เกิดข้อผิดพลาดในการลบสินค้าจากตะกร้า");
  }
}

const createOrder = async (customer, data) => {
  const products = JSON.parse(customer.metadata.cart); // products จะมี productName

  try {
    const newOrder = await OrderModel.create({
      email: customer.metadata.email,
      customerId: data.customer,
      products, // products จะมี productName แทน
      subtotal: data.amount_subtotal / 100, // ✅ แปลงจาก cent เป็น THB
      total: data.amount_total / 100, // ✅ แปลงจาก cent เป็น THB
      shipping: data.customer_details,
      payment_status: data.payment_status,
    });

    if (newOrder) {
      console.log("Order created successfully");
      await clearCart(customer.metadata.email);
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ", error);
    throw new Error(error.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
  }
};

exports.webhook = async (req, res) => {
  console.log("Webhook is called!");
  console.log("Webhook body:", req.body);
  console.log("Webhook signature:", req.headers["stripe-signature"]);
  
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Event type:", event.type);
    console.log("Event data:", event.data.object);
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(400).send({ message: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case "checkout.session.completed":
      console.log("Payment received!");
      let data = event.data.object;
      console.log("Session data:", data);

      try {
        const customer = await stripe.customers.retrieve(data.customer);
        console.log("Customer data:", customer);
        await createOrder(customer, data);
      } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).send({ message: `Webhook Error: ${error.message}` });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).end();
};
