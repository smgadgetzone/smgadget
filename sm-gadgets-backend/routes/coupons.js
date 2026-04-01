const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// GET all coupons (Admin)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (err) {
    res.status(500).json(err);
  }
});

// POST create a coupon (Admin)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const newCoupon = new Coupon(req.body);
    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }
    res.status(500).json(err);
  }
});

// DELETE a coupon (Admin)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json("Coupon has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

// POST verify coupon (Public)
router.post("/verify", async (req, res) => {
  try {
    const { code, cartItems } = req.body;
    const coupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${code.trim()}$`, "i") } });
    
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code." });
    }

    // Check product applicability if any products are restricted
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
         return res.status(400).json({ message: "Coupon is product-specific. Please add items to your cart first." });
      }
      
      const isApplicable = cartItems.some(itemId => coupon.applicableProducts.includes(itemId));
      if (!isApplicable) {
        return res.status(400).json({ message: "This coupon is not applicable to the items in your cart." });
      }
    }
    
    res.status(200).json(coupon);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
