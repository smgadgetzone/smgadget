const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// POST contact form submission
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send to store owner
    const mailToOwner = {
      from: `SM Gadgets Contact <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `New Contact: ${subject || 'General Inquiry'} — from ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #7c3aed); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">New Contact Form Submission</h2>
          </div>
          <div style="padding: 25px; background: white; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>Name:</strong></td><td style="padding: 8px 0;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #6b7280;"><strong>Phone:</strong></td><td style="padding: 8px 0;">${phone}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Subject:</strong></td><td style="padding: 8px 0;">${subject || 'General Inquiry'}</td></tr>
            </table>
            <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #3b82f6;">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <div style="background: #1e293b; padding: 15px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">Reply directly to this email to respond to the customer.</p>
          </div>
        </div>
      `,
    };

    // Send acknowledgment to customer
    const mailToCustomer = {
      from: `SM Gadgets <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "We received your message! — SM Gadgets",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #7c3aed); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">Thank You, ${name}!</h2>
          </div>
          <div style="padding: 25px; background: white; border: 1px solid #e5e7eb;">
            <p>We've received your message and will get back to you within 24 hours.</p>
            <div style="padding: 15px; background: #f0f9ff; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>Your message:</strong></p>
              <p style="margin: 5px 0 0; white-space: pre-wrap; font-size: 13px;">${message}</p>
            </div>
            <p style="font-size: 13px; color: #6b7280;">In the meantime, feel free to reach us at +91 9146381153</p>
          </div>
          <div style="background: #1e293b; padding: 15px; text-align: center; border-radius: 0 0 12px 12px;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} SM Gadgets. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailToOwner);
    await transporter.sendMail(mailToCustomer);

    res.status(200).json({ message: "Your message has been sent successfully!" });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ message: "Failed to send message. Please try again later." });
  }
});

module.exports = router;
