const nodemailer = require("nodemailer");

const createTransporter = () => nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ─── Shared HTML Components ───────────────────────────────────────────────────
const emailHeader = () => `
  <div style="background:linear-gradient(135deg,#3b82f6 0%,#7c3aed 100%);padding:35px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:30px;letter-spacing:1px;">SM GADGETS</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Premium Accessories for Your Digital Life</p>
  </div>`;

const emailFooter = () => `
  <div style="background:#0f172a;padding:25px;text-align:center;">
    <p style="color:#94a3b8;margin:0 0 6px;font-size:13px;">📞 Customer Support: <strong style="color:#60a5fa;">+91 9146381153</strong></p>
    <p style="color:#94a3b8;margin:0;font-size:12px;">© ${new Date().getFullYear()} SM Gadgets. All rights reserved.</p>
  </div>`;

const wrap = (content) => `
  <div style="font-family:'Segoe UI',Arial,sans-serif;color:#333;max-width:620px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    ${emailHeader()}
    <div style="padding:40px 32px;background:#ffffff;">${content}</div>
    ${emailFooter()}
  </div>`;

const infoBox = (rows) => `
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:24px 0;">
    <table style="width:100%;border-collapse:collapse;">
      ${rows.map(([label, value, color]) => `
        <tr>
          <td style="color:#64748b;font-size:13px;text-transform:uppercase;font-weight:600;padding:7px 0;">${label}</td>
          <td style="text-align:right;font-weight:700;color:${color || '#1e293b'};font-size:14px;padding:7px 0;">${value}</td>
        </tr>`).join('')}
    </table>
  </div>`;

const itemsTable = (products) => `
  <h3 style="font-size:17px;color:#1e293b;border-bottom:2px solid #f1f5f9;padding-bottom:10px;margin:28px 0 14px;">🛍️ Items Ordered</h3>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="padding:10px 8px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;">Item</th>
        <th style="padding:10px 8px;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;">Qty</th>
        <th style="padding:10px 8px;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;">Price</th>
        <th style="padding:10px 8px;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${products.map(p => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:14px 8px;color:#1e293b;font-weight:500;">${p.name}</td>
          <td style="padding:14px 8px;text-align:center;color:#4b5563;">${p.quantity}</td>
          <td style="padding:14px 8px;text-align:right;color:#4b5563;">₹${Number(p.price).toLocaleString()}</td>
          <td style="padding:14px 8px;text-align:right;font-weight:700;color:#1e293b;">₹${(Number(p.price) * Number(p.quantity)).toLocaleString()}</td>
        </tr>`).join('')}
    </tbody>
  </table>`;

const totalBox = (amount) => `
  <div style="text-align:right;margin-top:16px;padding:18px 20px;background:#eff6ff;border-radius:10px;">
    <span style="color:#1e3a8a;font-size:14px;font-weight:600;margin-right:16px;">GRAND TOTAL</span>
    <span style="color:#2563eb;font-size:26px;font-weight:800;">₹${Number(amount).toLocaleString()}</span>
  </div>`;

const addressBlock = (address) => `
  <h3 style="font-size:17px;color:#1e293b;border-bottom:2px solid #f1f5f9;padding-bottom:10px;margin:28px 0 14px;">📍 Delivery Address</h3>
  <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0;">
    <strong>${address.name}</strong><br/>
    ${address.address}<br/>
    ${address.city}, ${address.state} – ${address.pincode}<br/>
    <span style="color:#3b82f6;">📞 ${address.phone}</span>
  </p>`;

const trackingBox = (awb) => `
  <div style="margin:28px 0;padding:24px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:12px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:#065f46;text-transform:uppercase;font-weight:700;letter-spacing:1px;">🏷️ Your Tracking Number</p>
    <p style="margin:0;font-size:26px;font-weight:900;color:#047857;letter-spacing:3px;font-family:monospace;">${awb}</p>
    <p style="margin:10px 0 0;font-size:13px;color:#065f46;">Track on <strong>Shiprocket</strong> or <strong>Delhivery/XpressBees</strong> using the above AWB number</p>
  </div>
  <div style="margin:20px 0;padding:20px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">
    <p style="margin:0 0 10px;font-weight:700;color:#0369a1;">📱 How to Track Your Order:</p>
    <ol style="margin:0;padding-left:20px;color:#0c4a6e;line-height:1.9;font-size:14px;">
      <li>Visit <a href="https://shiprocket.co/tracking" style="color:#2563eb;">shiprocket.co/tracking</a></li>
      <li>Enter your tracking number: <strong>${awb}</strong></li>
      <li>OR track directly on the courier's website using the same number</li>
    </ol>
  </div>`;

// ─── Email Senders ─────────────────────────────────────────────────────────────

/**
 * 1. Order Placed — Full invoice email
 */
const sendOrderPlacedEmail = async (order) => {
    const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)';
    const html = wrap(`
        <h2 style="color:#1e293b;margin-top:0;font-size:22px;">✅ Order Confirmed, ${order.address.name}!</h2>
        <p style="color:#4b5563;line-height:1.7;">Thank you for shopping with <strong>SM Gadgets</strong>. Your order has been received and is being prepared.</p>
        ${infoBox([
            ['Order ID', `#${order._id.toString().slice(-6).toUpperCase()}`, '#1e293b'],
            ['Date', new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }), '#1e293b'],
            ['Payment Method', paymentLabel, '#1e293b'],
            ['Payment Status', order.paymentMethod === 'cod' ? 'Pay on Delivery' : '✅ Paid', order.paymentMethod === 'cod' ? '#d97706' : '#059669'],
            ['Estimated Delivery', '3–7 Business Days', '#2563eb']
        ])}
        ${addressBlock(order.address)}
        ${itemsTable(order.products)}
        ${totalBox(order.amount)}
        <p style="margin-top:28px;color:#4b5563;font-size:15px;line-height:1.7;">
          We'll send you another email once your shipment is dispatched with a <strong>tracking number</strong>. Stay tuned! 🚀
        </p>
    `);

    return createTransporter().sendMail({
        from: `SM Gadgets <${process.env.EMAIL_USER}>`,
        to: order.address.email,
        subject: `✅ Order Confirmed #${order._id.toString().slice(-6).toUpperCase()} — SM Gadgets`,
        html
    });
};

/**
 * 2. Order Synced / Processing — No AWB yet
 */
const sendOrderProcessingEmail = async (order) => {
    const html = wrap(`
        <h2 style="color:#1e293b;margin-top:0;font-size:22px;">⚙️ We're Preparing Your Shipment!</h2>
        <p style="color:#4b5563;line-height:1.7;">Hi <strong>${order.address.name}</strong>, great news! Your order has been confirmed and our team has started packing your gadgets.</p>
        ${infoBox([
            ['Order ID', `#${order._id.toString().slice(-6).toUpperCase()}`, '#1e293b'],
            ['Status', 'Processing', '#d97706'],
            ['Estimated Dispatch', 'Within 1–2 Business Days', '#2563eb']
        ])}
        <div style="margin:24px 0;padding:20px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;">
            <p style="margin:0;color:#92400e;font-size:14px;">
              🕐 <strong>Your tracking number (AWB) will be shared soon</strong> via email once the courier is assigned. 
              You don't need to do anything — we'll notify you automatically!
            </p>
        </div>
        ${addressBlock(order.address)}
    `);

    return createTransporter().sendMail({
        from: `SM Gadgets <${process.env.EMAIL_USER}>`,
        to: order.address.email,
        subject: `⚙️ Order Processing #${order._id.toString().slice(-6).toUpperCase()} — SM Gadgets`,
        html
    });
};

/**
 * 3. AWB Assigned — Tracking number email
 */
const sendAWBAssignedEmail = async (order) => {
    const html = wrap(`
        <h2 style="color:#1e293b;margin-top:0;font-size:22px;">🚀 Your Order Has Been Dispatched!</h2>
        <p style="color:#4b5563;line-height:1.7;">Hi <strong>${order.address.name}</strong>, your SM Gadgets order is on its way! Here are your tracking details:</p>
        ${infoBox([
            ['Order ID', `#${order._id.toString().slice(-6).toUpperCase()}`, '#1e293b'],
            ['Tracking Number (AWB)', order.awbNumber, '#059669'],
            ['Estimated Delivery', '2–5 Business Days', '#2563eb']
        ])}
        ${trackingBox(order.awbNumber)}
        ${addressBlock(order.address)}
        ${itemsTable(order.products)}
    `);

    return createTransporter().sendMail({
        from: `SM Gadgets <${process.env.EMAIL_USER}>`,
        to: order.address.email,
        subject: `🚀 Dispatched! Track Your Order #${order._id.toString().slice(-6).toUpperCase()} — SM Gadgets`,
        html
    });
};

/**
 * 4. Out for Delivery
 */
const sendOutForDeliveryEmail = async (order) => {
    const html = wrap(`
        <h2 style="color:#1e293b;margin-top:0;font-size:22px;">🛵 Out for Delivery Today!</h2>
        <p style="color:#4b5563;line-height:1.7;">Hi <strong>${order.address.name}</strong>, your order is <strong>out for delivery</strong> and will reach you today! Please keep your phone reachable.</p>
        <div style="margin:24px 0;padding:20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
            <p style="margin:0;font-size:14px;color:#1e40af;">
              📦 <strong>Tip:</strong> If you're not available, the courier will attempt re-delivery. Keep ₹${order.paymentMethod === 'cod' ? order.amount.toLocaleString() : '0'} ready ${order.paymentMethod === 'cod' ? '(COD amount)' : '(already paid online)'}.
            </p>
        </div>
        ${order.awbNumber ? infoBox([['Tracking Number', order.awbNumber, '#059669']]) : ''}
        ${addressBlock(order.address)}
    `);

    return createTransporter().sendMail({
        from: `SM Gadgets <${process.env.EMAIL_USER}>`,
        to: order.address.email,
        subject: `🛵 Out for Delivery! Order #${order._id.toString().slice(-6).toUpperCase()} — SM Gadgets`,
        html
    });
};

/**
 * 5. Delivered
 */
const sendDeliveredEmail = async (order) => {
    const html = wrap(`
        <h2 style="color:#059669;margin-top:0;font-size:22px;">🎉 Your Order Has Been Delivered!</h2>
        <p style="color:#4b5563;line-height:1.7;">Hi <strong>${order.address.name}</strong>, your SM Gadgets order has been successfully delivered! We hope you love your new gadgets. 😍</p>
        ${infoBox([
            ['Order ID', `#${order._id.toString().slice(-6).toUpperCase()}`, '#1e293b'],
            ['Status', '✅ Delivered', '#059669']
        ])}
        ${itemsTable(order.products)}
        <div style="margin:28px 0;padding:22px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;text-align:center;">
            <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#166534;">Enjoying your purchase?</p>
            <p style="margin:0;color:#15803d;font-size:14px;">Leave a review or share your experience — it means the world to us! 🙏</p>
        </div>
        <p style="color:#4b5563;font-size:14px;">If you have any issues with your product, please contact us within 24 hours.</p>
    `);

    return createTransporter().sendMail({
        from: `SM Gadgets <${process.env.EMAIL_USER}>`,
        to: order.address.email,
        subject: `🎉 Delivered! Order #${order._id.toString().slice(-6).toUpperCase()} — SM Gadgets`,
        html
    });
};

/**
 * 6. Cancelled / RTO
 */
const sendCancelledEmail = async (order, reason = '') => {
    const html = wrap(`
        <h2 style="color:#dc2626;margin-top:0;font-size:22px;">❌ Order Cancelled</h2>
        <p style="color:#4b5563;line-height:1.7;">Hi <strong>${order.address.name}</strong>, unfortunately your order has been cancelled${reason ? ` (${reason})` : ''}.</p>
        ${infoBox([
            ['Order ID', `#${order._id.toString().slice(-6).toUpperCase()}`, '#1e293b'],
            ['Status', 'Cancelled', '#dc2626']
        ])}
        <p style="color:#4b5563;font-size:14px;line-height:1.7;">If this was unexpected or you'd like to re-order, please contact our support team.</p>
    `);

    return createTransporter().sendMail({
        from: `SM Gadgets <${process.env.EMAIL_USER}>`,
        to: order.address.email,
        subject: `Order Cancelled #${order._id.toString().slice(-6).toUpperCase()} — SM Gadgets`,
        html
    });
};

module.exports = {
    sendOrderPlacedEmail,
    sendOrderProcessingEmail,
    sendAWBAssignedEmail,
    sendOutForDeliveryEmail,
    sendDeliveredEmail,
    sendCancelledEmail
};
