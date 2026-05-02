/**
 * Migration Script: Move all product images from Base64 (MongoDB) to Cloudinary
 * 
 * Usage:
 *   1. Set your .env with CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   2. Run: node scripts/migrateToCloudinary.js
 * 
 * Safe to run multiple times — skips products already on Cloudinary.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config(); // MUST be before cloudinary require — it reads env vars at import time
const cloudinary = require("../utils/cloudinary");
const Product = require("../models/Product");

const isBase64 = (str) => {
  return str && typeof str === "string" && str.startsWith("data:");
};

const uploadToCloudinary = async (base64Str, folder, resourceType = "image") => {
  try {
    const options = {
      folder,
      resource_type: resourceType,
      timeout: 120000, // 2 minute timeout per upload
    };

    if (resourceType === "image") {
      options.transformation = [
        { width: 1280, height: 1280, crop: "limit" },
        { quality: "auto:good" },
      ];
    }

    const result = await cloudinary.uploader.upload(base64Str, options);
    return result.secure_url;
  } catch (err) {
    console.error(`  ❌ Upload failed: ${err.message}`);
    return null;
  }
};

const migrateProducts = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB\n");

    // Step 1: Get just the IDs (lightweight)
    console.log("📋 Fetching product IDs...");
    const productIds = await Product.find({}).select("_id title").lean();
    console.log(`📦 Found ${productIds.length} products to check\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Step 2: Process ONE product at a time by fetching individually
    for (let i = 0; i < productIds.length; i++) {
      const { _id, title } = productIds[i];
      const label = `[${i + 1}/${productIds.length}] ${title}`;
      
      console.log(`${label}: Fetching full data...`);
      const product = await Product.findById(_id).lean();
      
      if (!product) {
        console.log(`${label}: ⚠️ Product not found, skipping\n`);
        continue;
      }

      let needsUpdate = false;
      const updates = {};

      // 1. Migrate main image (img)
      if (isBase64(product.img)) {
        console.log(`${label}: Uploading main image...`);
        const url = await uploadToCloudinary(product.img, "sm-gadgets/products");
        if (url) {
          updates.img = url;
          needsUpdate = true;
          console.log(`  ✅ Main image done`);
        } else {
          failedCount++;
        }
      } else {
        console.log(`${label}: Main image already OK`);
      }

      // 2. Migrate gallery images (images[])
      if (product.images && product.images.length > 0) {
        const newImages = [];
        let hasBase64Gallery = false;

        for (let j = 0; j < product.images.length; j++) {
          const img = product.images[j];
          if (isBase64(img)) {
            hasBase64Gallery = true;
            console.log(`${label}: Uploading gallery ${j + 1}/${product.images.length}...`);
            const url = await uploadToCloudinary(img, "sm-gadgets/products");
            if (url) {
              newImages.push(url);
              console.log(`  ✅ Gallery ${j + 1} done`);
            } else {
              failedCount++;
              newImages.push(img); // Keep original on failure
            }
          } else {
            newImages.push(img);
          }
        }

        if (hasBase64Gallery) {
          updates.images = newImages;
          needsUpdate = true;
        }
      }

      // 3. Migrate video
      if (isBase64(product.video)) {
        console.log(`${label}: Uploading video...`);
        const url = await uploadToCloudinary(product.video, "sm-gadgets/videos", "video");
        if (url) {
          updates.video = url;
          needsUpdate = true;
          console.log(`  ✅ Video done`);
        } else {
          failedCount++;
        }
      }

      // 4. Save updates
      if (needsUpdate) {
        await Product.findByIdAndUpdate(_id, { $set: updates });
        migratedCount++;
        console.log(`  💾 Saved!\n`);
      } else {
        skippedCount++;
        console.log(`  ⏭️ Nothing to migrate\n`);
      }

      // Delay to avoid Cloudinary rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 MIGRATION COMPLETE!");
    console.log(`  ✅ Migrated: ${migratedCount} products`);
    console.log(`  ⏭️ Skipped:  ${skippedCount} products`);
    console.log(`  ❌ Failed:   ${failedCount} uploads`);
    console.log("=".repeat(50));
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

migrateProducts();
