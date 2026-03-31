const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Create a razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Configure client checkout key seamlessly from the single .env
router.get('/config', (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

// Create Order
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Create an order on razorpay
    const options = {
      amount: Math.round(amount * 100), // convert INR to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };
    
    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ message: "Some error occurred creating Razorpay order" });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Verify Signature
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    
    // Hash it using the secret
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Signature is valid
      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error('Error verifying razorpay signature:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
