const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    products: [
      {
        productId: {
          type: String,
        },
        name: String,
        price: Number,
        image: String,
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],

    amount: {
      type: Number,
      required: true,
    },

    couponCode: {
      type: String,
    },

    address: {
      type: Object,
      required: true,
    },

    status: {
      type: String,
      default: "pending",
    },

    paymentId: {
      type: String,
      default: null,
    },

    paymentStatus: {
      type: String,
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      default: "COD",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
