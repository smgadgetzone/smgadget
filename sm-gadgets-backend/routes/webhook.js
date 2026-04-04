const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// POST: Shiprocket Webhook for Tracking Updates
// Shiprocket sends a POST request here when status changes
router.post("/shiprocket", async (req, res) => {
    try {
        const { order_id, shipment_id, status, awb, courier_name } = req.body;

        if (!order_id) {
            return res.status(400).send("No order ID provided");
        }

        // Find the order in our database
        // Use shiprocketOrderId or the local _id
        const order = await Order.findOne({ 
            $or: [
                { _id: order_id.length === 24 ? order_id : null }, // Check if it's a valid MongoDB ID
                { shiprocketOrderId: order_id }
            ]
        });

        if (order) {
            // Update the logistics fields
            order.shippingStatus = status.toLowerCase();
            if (awb) order.awbNumber = awb;
            
            // Map Shiprocket status to our internal order status
            const statusMap = {
                "delivered": "delivered",
                "shipped": "shipped",
                "canceled": "cancelled",
                "out for delivery": "shipped",
                "pickup scheduled": "processing"
            };

            if (statusMap[status.toLowerCase()]) {
                order.status = statusMap[status.toLowerCase()];
            }

            await order.save();
            console.log(`Shiprocket Webhook: Updated Order ${order_id} to ${status}`);
            return res.status(200).send("OK");
        }

        res.status(404).send("Order not found");
    } catch (err) {
        console.error("Shiprocket Webhook Error:", err.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
