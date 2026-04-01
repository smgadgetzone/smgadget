const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const nodemailer = require("nodemailer");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Product = require("../models/Product");
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
          <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%); padding: 35px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px; letter-spacing: 1px;">SM GADGETS</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Premium Accessories for your Digital Life</p>
            </div>
            <div style="padding: 40px 30px; background: #ffffff;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">Thank you for your order, ${req.body.address.name}!</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">We've received your order and our team is currently preparing it for dispatch. You'll receive another update once your gadgets are on their way.</p>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #f1f5f9;">
                <table style="width: 100%;">
                  <tr>
                    <td style="color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold;">Order ID</td>
                    <td style="text-align: right; font-weight: bold; color: #1e293b;">#${savedOrder._id.toString().slice(-6).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold; padding-top: 10px;">Status</td>
                    <td style="text-align: right; font-weight: bold; color: #10b981; padding-top: 10px;">Confirmed</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold; padding-top: 10px;">Delivery Estimate</td>
                    <td style="text-align: right; font-weight: bold; color: #1e293b; padding-top: 10px;">2-5 Business Days</td>
                  </tr>
                </table>
              </div>
              
              <h3 style="color: #1e293b; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 15px;">Shipping Destination</h3>
              <p style="color: #4b5563; line-height: 1.5; font-size: 15px;">
                <strong>${req.body.address.name}</strong><br/>
                ${req.body.address.address}<br/>
                ${req.body.address.city}, ${req.body.address.state} - ${req.body.address.pincode}<br/>
                <span style="color: #3b82f6;">Phone: ${req.body.address.phone}</span>
              </p>

              <h3 style="color: #1e293b; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 35px; margin-bottom: 15px;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <th style="padding: 12px 0; text-align: left; color: #64748b; font-size: 13px;">ITEM</th>
                    <th style="padding: 12px 0; text-align: center; color: #64748b; font-size: 13px;">QTY</th>
                    <th style="padding: 12px 0; text-align: right; color: #64748b; font-size: 13px;">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  ${req.body.products.map(p => `
                    <tr style="border-bottom: 1px solid #f8fafc;">
                      <td style="padding: 15px 0; color: #1e293b; font-weight: 500;">${p.name}</td>
                      <td style="padding: 15px 0; text-align: center; color: #4b5563;">${p.quantity}</td>
                      <td style="padding: 15px 0; text-align: right; color: #1e293b; font-weight: 600;">₹${p.price}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="margin-top: 25px; padding: 20px; background: #eff6ff; border-radius: 0 0 12px 12px; text-align: right;">
                <span style="color: #1e3a8a; font-size: 14px; font-weight: bold; margin-right: 15px;">GRAND TOTAL</span>
                <span style="color: #2563eb; font-size: 24px; font-weight: 800;">₹${req.body.amount.toLocaleString()}</span>
              </div>
              
              <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Need help? Our support team is just a call away.</p>
                <div style="display: inline-block; background: #3b82f6; color: white; padding: 12px 25px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  Customer Support: +91 9146381153
                </div>
              </div>
            </div>
            <div style="background: #0f172a; padding: 25px; text-align: center;">
              <p style="color: #94a3b8; margin: 0; font-size: 12px;">You received this because you shopped at SM Gadgets.</p>
              <p style="color: #94a3b8; margin: 8px 0 0; font-size: 12px;">© ${new Date().getFullYear()} SM Gadgets. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error("Email setup error:", emailErr);
    }

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

    // If status changed, send an email to user
    if (req.body.status && req.body.status !== oldOrder.status) {
      try {
        const transporter = createTransporter();
        const statusMap = {
          processing: { title: "Processing Your Order", text: "We're carefully picking and packing your items. They'll be ready for shipping soon!" },
          shipped: { title: "Your Order is on the Way! 🚚", text: "Exciting news! Your SM Gadgets order has been dispatched and is currently in transit to you." },
          delivered: { title: "Order Delivered! 📦", text: "Yay! Your gadgets have been delivered. We hope you love your new accessories!" },
          cancelled: { title: "Order Cancelled", text: "We're sorry to inform you that your order has been cancelled. If this was an accident, please try again or contact us." }
        };

        const updateInfo = statusMap[req.body.status.toLowerCase()] || { title: "Order Update", text: `Your order status has been updated to ${req.body.status}.` };

        const mailOptions = {
          from: `SM Gadgets <${process.env.EMAIL_USER}>`,
              to: updatedOrder.address.email,
              subject: `${updateInfo.title} - #${updatedOrder._id.toString().slice(-6).toUpperCase()}`,
              html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%); padding: 35px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px; letter-spacing: 1px;">SM GADGETS</h1>
                  </div>
                  <div style="padding: 40px 30px; background: #ffffff;">
                    <h2 style="color: #3b82f6; margin-top: 0; font-size: 24px;">${updateInfo.title}</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Hi ${updatedOrder.address.name},</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">${updateInfo.text}</p>
                    
                    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #f1f5f9;">
                      <table style="width: 100%;">
                        <tr>
                          <td style="color: #64748b; font-size: 14px; text-transform: uppercase;">Order ID</td>
                          <td style="text-align: right; font-weight: bold; color: #1e293b;">#${updatedOrder._id.toString().slice(-6).toUpperCase()}</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b; font-size: 14px; text-transform: uppercase; padding-top: 10px;">New Status</td>
                          <td style="text-align: right; font-weight: bold; color: #3b82f6; padding-top: 10px; text-transform: capitalize;">${req.body.status}</td>
                        </tr>
                      </table>
                    </div>

                    <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #f1f5f9;">
                      <p style="font-size: 14px; color: #64748b;">Thank you for shopping with us!</p>
                      <p style="font-size: 14px; color: #94a3b8;">SM Gadgets Team</p>
                    </div>
                  </div>
                  <div style="background: #0f172a; padding: 20px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} SM Gadgets. All rights reserved.</p>
                  </div>
                </div>
              `
        };
        transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error("Status email error:", emailErr);
      }
    }

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
