const express = require("express");
const router = express.Router();
const cloudinary = require("../utils/cloudinary");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// POST upload image to Cloudinary (admin only)
router.post("/image", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { image } = req.body; // Base64 string from frontend

    if (!image) {
      return res.status(400).json({ message: "No image provided" });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: "sm-gadgets/products",
      resource_type: "image",
      transformation: [
        { width: 1280, height: 1280, crop: "limit" }, // Max dimensions
        { quality: "auto:good" }, // Automatic quality optimization
        { fetch_format: "auto" }, // Auto webp/avif for supported browsers
      ],
    });

    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("[Cloudinary Upload Error]:", err);
    res.status(500).json({
      message: "Image upload failed",
      error: err.message,
    });
  }
});

// POST upload multiple images to Cloudinary (admin only)
router.post("/images", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { images } = req.body; // Array of Base64 strings

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const uploadPromises = images.map((img) =>
      cloudinary.uploader.upload(img, {
        folder: "sm-gadgets/products",
        resource_type: "image",
        transformation: [
          { width: 1280, height: 1280, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      })
    );

    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.secure_url);

    res.status(200).json({ urls });
  } catch (err) {
    console.error("[Cloudinary Multi-Upload Error]:", err);
    res.status(500).json({
      message: "Image upload failed",
      error: err.message,
    });
  }
});

// POST upload video to Cloudinary (admin only)
router.post("/video", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { video } = req.body; // Base64 string

    if (!video) {
      return res.status(400).json({ message: "No video provided" });
    }

    const result = await cloudinary.uploader.upload(video, {
      folder: "sm-gadgets/videos",
      resource_type: "video",
      chunk_size: 6000000, // 6MB chunks for large files
    });

    res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("[Cloudinary Video Upload Error]:", err);
    res.status(500).json({
      message: "Video upload failed",
      error: err.message,
    });
  }
});

module.exports = router;
