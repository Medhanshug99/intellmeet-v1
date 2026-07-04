const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/payment.controller.js');
const { protect } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
