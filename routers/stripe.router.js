const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripe.controller");

router.post("/create-checkout-session", stripeController.createCheckOutSession);
router.post("/", stripeController.webhook); 

module.exports = router;
