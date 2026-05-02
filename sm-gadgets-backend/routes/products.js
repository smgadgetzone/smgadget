const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// GET all products (public)
// All images now stored as Cloudinary URLs — lightweight and fast
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .select("title price img originalPrice discount inStock categories color isTrending isCombo priority quantity createdAt updatedAt")
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET single product (public)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});

// POST add product (admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    console.log(`[Product Add] Successfully added: ${newProduct.title}`);
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(`[Product Add Error]:`, err);
    // Return specific error message if it exists
    res.status(500).json({ 
      message: err.message || "Internal Server Error",
      error: err.name === 'ValidationError' ? err.errors : err
    });
  }
});

// PUT update product (admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error(`[Product Update Error]:`, err);
    res.status(500).json({ 
      message: err.message || "Internal Server Error",
      error: err.name === 'ValidationError' ? err.errors : err
    });
  }
});

// DELETE product (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Product has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
