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
    payment_method_types: ["card", "promptpay"], // Add payment method types
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
        }, // Replace with your shipping rate
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
        }, // Replace with your shipping rate
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
    line_items, // Pass the line items created.
    customer: customer.id, // Pass the customer ID created.
    mode: "payment",
    success_url: `${process.env.BASE_URL}/checkout-success`,
    cancel_url: `${process.env.BASE_URL}/cart`,
  });
  console.log(session);

  res.send({ url: session.url });
};

const clearCart = async (email, res) => {
  try {
    await CartModel.deleteMany({ email }); // ลบสินค้าทั้งหมดในตะกร้าของผู้ใช้
    console.log("Cart Cleared successfully");
  } catch (error) {
    res.status(500).send({
      message: error.message || "เกิดข้อผิดพลาดในการลบสินค้าจากตะกร้า",
    });
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
  console.log("Request body:", req.body);
  console.log("Stripe signature:", req.headers["stripe-signature"]);
  
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log("Using webhook secret:", endpointSecret);
  
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Event constructed successfully:", event.type);
  } catch (err) {
    console.error("Webhook Error:", err.message);
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
        console.log("Order created successfully");
      } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).send({ message: `Webhook Error: ${error.message}` });
      }
      break;

    case "payment_intent.succeeded":
      console.log("Payment intent succeeded!");
      const paymentIntent = event.data.object;
      console.log("Payment intent data:", paymentIntent);
      break;

    case "charge.succeeded":
      console.log("Charge succeeded!");
      const charge = event.data.object;
      console.log("Charge data:", charge);
      break;

    case "payment_intent.created":
      console.log("Payment intent created!");
      const createdIntent = event.data.object;
      console.log("Created intent data:", createdIntent);
      break;

    case "charge.updated":
      console.log("Charge updated!");
      const updatedCharge = event.data.object;
      console.log("Updated charge data:", updatedCharge);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).end();
};
