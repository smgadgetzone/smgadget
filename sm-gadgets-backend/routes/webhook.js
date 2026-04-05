const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const {
    sendOutForDeliveryEmail,
    sendDeliveredEmail,
    sendCancelledEmail,
    sendAWBAssignedEmail
} = require("../utils/emailService");

// POST: Shiprocket Webhook for Tracking Updates
// Register this URL in Shiprocket Dashboard → Settings → Webhooks:
// https://sm-gadgets-backend.onrender.com/api/webhook/tracking-update
// Token header: x-api-key
router.post("/tracking-update", async (req, res) => {
    try {
        // ── Token Verification (security check) ──────────────────
        const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
        const receivedToken = req.headers['x-api-key'] || req.body.token;
        if (expectedToken && receivedToken !== expectedToken) {
            // Return 200 so Shiprocket's test validates the URL
            // but don't process the event
            console.log("[Webhook] Token mismatch — ignoring event");
            return res.status(200).send("OK");
        }

        console.log("[Webhook] Shiprocket payload:", JSON.stringify(req.body).slice(0, 300));

        const { order_id, shipment_id, current_status, awb_code, courier_name } = req.body;

        // Shiprocket may send different field names depending on event type
        const status = (current_status || req.body.status || "").toLowerCase().trim();
        const orderId = order_id || req.body.order_id;
        const awb = awb_code || req.body.awb;

        if (!orderId) {
            console.log("[Webhook] No order_id in payload");
            return res.status(400).send("No order ID provided");
        }

        // Find the order — shiprocket sends either our DB _id or their own order_id
        const order = await Order.findOne({
            $or: [
                { _id: (orderId.length === 24 ? orderId : null) },
                { shiprocketOrderId: String(orderId) }
            ]
        });

        if (!order) {
            console.log(`[Webhook] Order not found for id: ${orderId}`);
            return res.status(404).send("Order not found");
        }

        const prevStatus = order.status;
        const prevAwb = order.awbNumber;

        // Update AWB if newly provided
        if (awb && !order.awbNumber) {
            order.awbNumber = awb;
        }
        if (courier_name) order.courierName = courier_name;
        order.shippingStatus = status;

        // Map Shiprocket status → our internal order status
        const statusMap = {
            "delivered":              "delivered",
            "shipment delivered":     "delivered",
            "rto delivered":          "cancelled",
            "rto initiated":          "cancelled",
            "rto":                    "cancelled",
            "shipped":                "shipped",
            "shipment dispatched":    "shipped",
            "in transit":             "shipped",
            "out for delivery":       "shipped",
            "pickup scheduled":       "processing",
            "pickup complete":        "processing",
            "pickup queued":          "processing",
            "awb assigned":           "processing",
        };

        if (statusMap[status]) {
            order.status = statusMap[status];
        }

        await order.save();
        console.log(`[Webhook] Order ${orderId} → status: "${status}" | internal: "${order.status}"`);

        // ─── Send emails based on status ──────────────────────────
        // Only send if status actually changed & order has an email
        if (order.address?.email) {

            // AWB just got assigned via webhook
            if (awb && !prevAwb && (status === "awb assigned" || status === "pickup scheduled")) {
                sendAWBAssignedEmail(order).catch(e => console.log("[Webhook Email] AWB:", e.message));
            }

            // Out for delivery
            else if (status === "out for delivery") {
                sendOutForDeliveryEmail(order).catch(e => console.log("[Webhook Email] OFD:", e.message));
            }

            // Delivered
            else if (status === "delivered" || status === "shipment delivered") {
                if (prevStatus !== "delivered") {
                    sendDeliveredEmail(order).catch(e => console.log("[Webhook Email] Delivered:", e.message));
                }
            }

            // RTO / Cancelled
            else if (status.includes("rto")) {
                const reason = "Return to Origin — delivery could not be completed.";
                sendCancelledEmail(order, reason).catch(e => console.log("[Webhook Email] RTO:", e.message));
            }
        }

        return res.status(200).send("OK");

    } catch (err) {
        console.error("[Webhook] Error:", err.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
