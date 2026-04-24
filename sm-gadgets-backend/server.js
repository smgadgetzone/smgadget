const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const compression = require("compression");

dotenv.config();

const app = express();
app.use(compression());

// middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://smgadget-alpha.vercel.app",
  "https://smgadget.in",
  "https://www.smgadget.in"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/logistics", require("./routes/shiprocket"));
app.use("/api/webhook", require("./routes/webhook"));

// database
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
