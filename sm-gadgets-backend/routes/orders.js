const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Product = require("../models/Product");
const { sendOrderPlacedEmail, sendOrderProcessingEmail, sendDeliveredEmail, sendCancelledEmail } = require("../utils/emailService");

// GET orders by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    let query;
    if (user && user.email) {
      const userEmail = user.email.trim();
      query = {
        $or: [
          { userId: req.params.userId },
          { "address.email": { $regex: new RegExp(`^${userEmail}$`, "i") } }
        ]
      };
    } else {
      query = { userId: req.params.userId };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET razorpay config
router.get("/razorpay-config", (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

// POST create razorpay order
router.post("/create-razorpay-order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: req.body.amount * 100, // amount in paisa
      currency: "INR",
      receipt: "receipt_order_" + Math.random().toString(36).substring(7),
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ message: "Error creating Razorpay order", error: err });
  }
});

// POST create order
router.post("/", async (req, res) => {
  try {
    // Verify Razorpay Payment if present
    if (req.body.paymentDetails) {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body.paymentDetails;
      const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest("hex");

      if (digest !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature!" });
      }
      // Add payment details to order payload
      req.body.paymentId = razorpay_payment_id;
      req.body.paymentStatus = "paid";
      req.body.status = "confirmed";
    } else {
      req.body.paymentStatus = "pending";
      req.body.status = "pending";
    }

    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();

    // Increment coupon usage if applied
    if (req.body.couponCode) {
      try {
        await Coupon.findOneAndUpdate(
          { code: { $regex: new RegExp(`^${req.body.couponCode.trim()}$`, "i") } },
          { $inc: { usageCount: 1 } }
        );
      } catch (err) {
        console.error("Coupon update error:", err);
      }
    }

    // Send full invoice email (non-blocking)
    sendOrderPlacedEmail(savedOrder).catch(e => console.error("Order placed email error:", e.message));

    // Decrement stock levels for all products
    try {
      for (const p of req.body.products) {
        const product = await Product.findById(p.productId);
        if (product) {
          const currentQty = Number(product.quantity || 0);
          const orderQty = Number(p.quantity || 0);
          const newQty = Math.max(0, currentQty - orderQty);
          
          console.log(`Inventory Update [${product.title}]: ${currentQty} -> ${newQty} (Ordered: ${orderQty})`);
          
          product.quantity = newQty;
          
          // Logic: Auto-disable if out of stock
          if (newQty === 0) {
            product.inStock = false;
            product.isTrending = false;
          }
          await product.save();
        }
      }
    } catch (stockErr) {
      console.error("Stock update error:", stockErr);
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// GET all orders (admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

// PUT cancel order (User)
router.put("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json("Order not found");

    if (order.status === "delivered" || order.status === "shipped") {
      return res.status(400).json("Cannot cancel a shipped or delivered order.");
    }

    order.status = "cancelled";
    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json(err);
  }
});

// PUT update order
router.put("/:id", async (req, res) => {
  try {
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) return res.status(404).json("Order not found");

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    // Send status-appropriate email (non-blocking)
    const newStatus = req.body.status.toLowerCase();
    if (newStatus === 'processing') {
      sendOrderProcessingEmail(updatedOrder).catch(e => console.error("Processing email error:", e.message));
    } else if (newStatus === 'delivered') {
      sendDeliveredEmail(updatedOrder).catch(e => console.error("Delivered email error:", e.message));
    } else if (newStatus === 'cancelled') {
      sendCancelledEmail(updatedOrder).catch(e => console.error("Cancelled email error:", e.message));
    }
    // Note: 'shipped' and 'out for delivery' emails are handled by the Shiprocket webhook

    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE order
router.delete("/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json("Order has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
