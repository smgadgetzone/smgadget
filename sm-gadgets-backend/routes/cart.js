const express = require("express");
const router = express.Router();

// GET cart
router.get("/", (req, res) => {
  res.json({
    message: "Cart route working",
  });
});

// POST add to cart
router.post("/", (req, res) => {
  const item = req.body;
  res.json({
    message: "Item added to cart",
    item,
  });
});

module.exports = router;
