const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountType: {
      type: String, // 'percent' or 'flat'
      enum: ['percent', 'flat'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    applicableProducts: {
      type: [String], // Array of Product IDs
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", CouponSchema);
