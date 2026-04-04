const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/Order");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

let cachedToken = null;
let tokenExpiry = null;

// Helper: Get Shiprocket Token (cached for 23h)
const getShiprocketToken = async () => {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }
    const response = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
        email: SHIPROCKET_EMAIL,
        password: SHIPROCKET_PASSWORD
    });
    if (response.data && response.data.token) {
        cachedToken = response.data.token;
        tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
        return cachedToken;
    }
    throw new Error("Failed to get Shiprocket token");
};

// Helper: Auto-assign AWB using recommended courier
const autoAssignAWB = async (shipmentId, token) => {
    try {
        const response = await axios.post(
            "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
            { shipment_id: [Number(shipmentId)] },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const awb = response.data?.response?.data?.awb_code;
        if (awb) {
            console.log(`[Shiprocket] AWB Auto-Assigned: ${awb} for shipment ${shipmentId}`);
            return awb;
        }
        // Try alternative response path
        const altAwb = response.data?.awb_code;
        if (altAwb) return altAwb;
        console.log(`[Shiprocket] AWB response (no awb found):`, JSON.stringify(response.data).slice(0, 300));
        return null;
    } catch (err) {
        const errMsg = err.response?.data?.message || err.message;
        console.log(`[Shiprocket] AWB auto-assign skipped: ${errMsg}`);
        return null; // Non-fatal - order still synced
    }
};

// POST: Bulk sync orders to Shiprocket (with auto-AWB)
router.post("/sync-bulk", authMiddleware, adminMiddleware, async (req, res) => {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds)) {
        return res.status(400).json({ message: "Invalid order IDs" });
    }

    let token;
    try {
        token = await getShiprocketToken();
    } catch (err) {
        return res.status(500).json({ message: "Shiprocket login failed", error: err.message });
    }

    const results = [];

    for (const orderId of orderIds) {
        const order = await Order.findById(orderId);
        if (!order) {
            results.push({ id: orderId, status: "error", message: "Order not found" });
            continue;
        }
        if (order.shiprocketOrderId) {
            results.push({ id: orderId, status: "skipped", message: "Already synced" });
            continue;
        }

        // Sanitize address fields
        const rawPincode = String(order.address?.pincode || '110001').replace(/\D/g, '');
        const pincode = rawPincode.length >= 6 ? rawPincode.slice(0, 6) : rawPincode.padStart(6, '0');
        const rawPhone = String(order.address?.phone || '9999999999').replace(/\D/g, '');
        const phone = rawPhone.slice(-10).padStart(10, '0');

        const shiprocketOrderData = {
            order_id: String(order._id),
            order_date: new Date(order.createdAt).toISOString().split('T')[0],
            pickup_location: "Home",
            billing_customer_name: order.address?.name || "Customer",
            billing_last_name: "",
            billing_address: order.address?.address || "Address",
            billing_city: order.address?.city || "City",
            billing_pincode: pincode,
            billing_state: order.address?.state || "State",
            billing_country: "India",
            billing_email: order.address?.email || "guest@gmail.com",
            billing_phone: phone,
            shipping_is_billing: true,
            order_items: order.products.map(p => ({
                name: p.name || "Product",
                sku: String(p.productId || p._id || "SKU-001"),
                units: p.quantity || 1,
                selling_price: p.price || 1
            })),
            payment_method: order.paymentMethod === 'cod' ? "COD" : "Prepaid",
            sub_total: order.amount,
            length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH || 10),
            breadth: Number(process.env.SHIPROCKET_DEFAULT_WIDTH || 10),
            height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT || 5),
            weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5)
        };

        // Use per-product dimensions if available
        try {
            const Product = require('../models/Product');
            let totalWeight = 0, maxLen = 10, maxBreadth = 10, maxH = 5;
            for (const item of order.products) {
                const prod = await Product.findById(item.productId).lean();
                if (prod) {
                    totalWeight += (prod.weight || 0.5) * (item.quantity || 1);
                    if ((prod.length || 10) > maxLen) maxLen = prod.length;
                    if ((prod.breadth || 10) > maxBreadth) maxBreadth = prod.breadth;
                    if ((prod.height || 5) > maxH) maxH = prod.height;
                }
            }
            if (totalWeight > 0) {
                shiprocketOrderData.weight = totalWeight;
                shiprocketOrderData.length = maxLen;
                shiprocketOrderData.breadth = maxBreadth;
                shiprocketOrderData.height = maxH;
            }
        } catch (dimErr) {
            console.log("[Shiprocket] Using default dims:", dimErr.message);
        }

        console.log(`[Shiprocket] Syncing ${orderId} | pincode: ${pincode} | phone: ${phone}`);

        try {
            const response = await axios.post(
                "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
                shiprocketOrderData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data && response.data.order_id) {
                order.shiprocketOrderId = response.data.order_id;
                order.shiprocketShipmentId = response.data.shipment_id;
                order.shippingStatus = "synced";
                order.status = "processing";
                await order.save();
                results.push({
                    id: orderId, status: "success",
                    shiprocketId: response.data.order_id
                });
            } else {
                results.push({ id: orderId, status: "error", message: "Invalid Shiprocket response" });
            }
        } catch (apiErr) {
            const errMsg = apiErr.response?.data?.message || JSON.stringify(apiErr.response?.data) || apiErr.message;
            console.error(`[Shiprocket] Error syncing ${orderId}:`, errMsg);
            results.push({ id: orderId, status: "error", message: errMsg });
        }
    }

    res.status(200).json({ results });
});

// POST: Bulk Assign AWB for selected synced orders
router.post("/assign-awb-bulk", authMiddleware, adminMiddleware, async (req, res) => {
    const { orderIds } = req.body;
    if (!orderIds || !Array.isArray(orderIds)) {
        return res.status(400).json({ message: "Invalid order IDs" });
    }
    let token;
    try {
        token = await getShiprocketToken();
    } catch (err) {
        return res.status(500).json({ message: "Shiprocket login failed", error: err.message });
    }

    const results = [];
    for (const orderId of orderIds) {
        const order = await Order.findById(orderId);
        if (!order || !order.shiprocketShipmentId) {
            results.push({ id: orderId, status: "error", message: "Order not synced yet or not found" });
            continue;
        }
        if (order.awbNumber) {
            results.push({ id: orderId, status: "skipped", message: "AWB already assigned", awb: order.awbNumber });
            continue;
        }
        const awb = await autoAssignAWB(order.shiprocketShipmentId, token);
        if (awb) {
            order.awbNumber = awb;
            order.shippingStatus = "awb_assigned";
            await order.save();
            results.push({ id: orderId, status: "success", awb });
        } else {
            results.push({ id: orderId, status: "error", message: "AWB assignment failed — check Shiprocket wallet balance" });
        }
    }
    res.json({ results });
});

router.post("/generate-labels", authMiddleware, adminMiddleware, async (req, res) => {
    const { shipmentIds } = req.body;
    if (!shipmentIds || !shipmentIds.length) {
        return res.status(400).json({ message: "No shipment IDs provided" });
    }
    try {
        const token = await getShiprocketToken();
        const response = await axios.post(
            "https://apiv2.shiprocket.in/v1/external/courier/generate/label",
            { shipment_id: shipmentIds.map(Number) },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("[Shiprocket] Labels response:", JSON.stringify(response.data).slice(0, 300));
        res.json(response.data);
    } catch (err) {
        const errDetail = err.response?.data || err.message;
        console.error("[Shiprocket] Label error:", JSON.stringify(errDetail));
        res.status(500).json({ message: "Label error", error: errDetail });
    }
});

// POST: Schedule Pickup
router.post("/schedule-pickup", authMiddleware, adminMiddleware, async (req, res) => {
    const { shipmentIds } = req.body;
    if (!shipmentIds || !shipmentIds.length) {
        return res.status(400).json({ message: "No shipment IDs provided" });
    }
    try {
        const token = await getShiprocketToken();
        const response = await axios.post(
            "https://apiv2.shiprocket.in/v1/external/courier/generate/pickup",
            { shipment_id: shipmentIds.map(Number) },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("[Shiprocket] Pickup response:", JSON.stringify(response.data).slice(0, 300));
        res.json(response.data);
    } catch (err) {
        const errDetail = err.response?.data || err.message;
        console.error("[Shiprocket] Pickup error:", JSON.stringify(errDetail));
        res.status(500).json({ message: "Pickup error", error: errDetail });
    }
});

// GET: Track shipment
router.get("/track/:shipmentId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const token = await getShiprocketToken();
        const response = await axios.get(
            `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${req.params.shipmentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ message: "Tracking error", error: err.response?.data || err.message });
    }
});

module.exports = router;
