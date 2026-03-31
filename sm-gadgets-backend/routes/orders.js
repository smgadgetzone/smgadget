const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const nodemailer = require("nodemailer");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const Razorpay = require("razorpay");
const crypto = require("crypto");
// Email transporter (configured from .env)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

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

    // Send confirmation email (non-blocking)
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `SM Gadgets <${process.env.EMAIL_USER}>`,
        to: req.body.address.email,
        subject: "Order Confirmation - SM Gadgets",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">SM Gadgets</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Order Confirmation</p>
            </div>
            <div style="padding: 30px; background: #fff; border: 1px solid #e5e7eb;">
              <h2 style="color: #3b82f6; margin-top: 0;">Thank you, ${req.body.address.name}!</h2>
              <p>We're excited to confirm your order has been received.</p>
              
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${savedOrder._id.toString().slice(-6).toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> 2-3 business days</p>
              </div>
              
              <h3 style="border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Shipping Address</h3>
              <p>${req.body.address.address}<br/>
              ${req.body.address.city}, ${req.body.address.state} - ${req.body.address.pincode}<br/>
              Phone: ${req.body.address.phone}</p>

              <h3 style="border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Product</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Qty</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">Price</th>
                </tr>
                ${req.body.products.map(p => `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.name}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${p.quantity}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">₹${p.price}</td>
                  </tr>
                `).join('')}
              </table>

              <div style="text-align: right; margin-top: 15px; padding: 15px; background: #f0f9ff; border-radius: 8px;">
                <h3 style="margin: 0; color: #3b82f6;">Total: ₹${req.body.amount}</h3>
              </div>
              
              <p style="margin-top: 30px; font-size: 13px; color: #94a3b8; text-align: center;">
                Questions? Reply to this email or call us at +91 9146381153
              </p>
            </div>
            <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="color: #94a3b8; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} SM Gadgets. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    } catch (emailErr) {
      console.error("Email setup error:", emailErr);
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
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
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
