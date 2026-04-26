/**
 * Migration Script: Move all product images from Base64 (MongoDB) to Cloudinary
 * 
 * Usage:
 *   1. Set your .env with CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   2. Run: node scripts/migrateToCloudinary.js
 * 
 * This script is SAFE to run multiple times — it skips products that already have
 * Cloudinary URLs (starting with "https://res.cloudinary.com").
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cloudinary = require("../utils/cloudinary");
const Product = require("../models/Product");

dotenv.config();

const isBase64 = (str) => {
  return str && typeof str === "string" && str.startsWith("data:");
};

const isAlreadyMigrated = (str) => {
  return (
    str &&
    typeof str === "string" &&
    (str.startsWith("https://res.cloudinary.com") || str.startsWith("http://res.cloudinary.com"))
  );
};

const uploadToCloudinary = async (base64Str, folder, resourceType = "image") => {
  try {
    const options = {
      folder,
      resource_type: resourceType,
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
    console.error(`  ❌ Upload failed:`, err.message);
    return null;
  }
};

const migrateProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB\n");

    // Get ALL products (no field filter)
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to check\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const label = `[${i + 1}/${products.length}] ${product.title}`;
      let needsUpdate = false;
      const updates = {};

      // 1. Migrate main image (img)
      if (isBase64(product.img)) {
        console.log(`${label}: Uploading main image...`);
        const url = await uploadToCloudinary(product.img, "sm-gadgets/products");
        if (url) {
          updates.img = url;
          needsUpdate = true;
          console.log(`  ✅ Main image → ${url.substring(0, 60)}...`);
        } else {
          failedCount++;
          console.log(`  ❌ Failed to upload main image`);
        }
      } else if (isAlreadyMigrated(product.img)) {
        // Already migrated
      } else if (!product.img) {
        console.log(`${label}: ⚠️ No main image found`);
      }

      // 2. Migrate gallery images (images[])
      if (product.images && product.images.length > 0) {
        const newImages = [];
        let hasBase64Gallery = false;

        for (let j = 0; j < product.images.length; j++) {
          const img = product.images[j];
          if (isBase64(img)) {
            hasBase64Gallery = true;
            console.log(`${label}: Uploading gallery image ${j + 1}/${product.images.length}...`);
            const url = await uploadToCloudinary(img, "sm-gadgets/products");
            if (url) {
              newImages.push(url);
              console.log(`  ✅ Gallery ${j + 1} → ${url.substring(0, 60)}...`);
            } else {
              failedCount++;
              newImages.push(img); // Keep original on failure
            }
          } else {
            newImages.push(img); // Already a URL, keep it
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
          console.log(`  ✅ Video → ${url.substring(0, 60)}...`);
        } else {
          failedCount++;
          console.log(`  ❌ Failed to upload video`);
        }
      }

      // 4. Save updates
      if (needsUpdate) {
        await Product.findByIdAndUpdate(product._id, { $set: updates });
        migratedCount++;
        console.log(`  💾 Saved to database\n`);
      } else {
        skippedCount++;
        console.log(`${label}: ⏭️ Already migrated or no Base64 data\n`);
      }

      // Small delay to avoid Cloudinary rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 MIGRATION COMPLETE!");
    console.log(`  ✅ Migrated: ${migratedCount} products`);
    console.log(`  ⏭️ Skipped:  ${skippedCount} products (already done)`);
    console.log(`  ❌ Failed:   ${failedCount} uploads`);
    console.log("=".repeat(50));
  } catch (err) {
    console.error("❌ Migration error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
};

migrateProducts();
