const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    desc: {
      type: String,
      required: true,
    },

    img: {
      type: String,
      required: true,
    },

    images: {
      type: Array, // Array of image strings
      default: []
    },

    price: {
      type: Number,
      required: true,
    },

    categories: {
      type: Array,
    },

    size: {
      type: String,
    },

    color: {
      type: String,
    },

    originalPrice: {
      type: Number,
    },

    rating: {
      type: Number,
      default: 4.5,
    },

    reviews: {
      type: Number,
      default: 0,
    },

    inStock: {
      type: Boolean,
      default: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    video: {
      type: String,
      default: '',
    },

    features: {
      type: [String],
      default: [],
    },

    isTrending: {
      type: Boolean,
      default: false,
    },

    isCombo: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: Number,
      default: 0,
    },
 
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Shipping dimensions for Shiprocket
    weight: { type: Number, default: 0.5 },   // in kg
    length: { type: Number, default: 10 },     // in cm
    breadth: { type: Number, default: 10 },    // in cm
    height: { type: Number, default: 5 },      // in cm
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
