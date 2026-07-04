const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { sendSuccess } = require('../utils/response.js');
const { AppError } = require('../middlewares/error.middleware');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_AMOUNTS = {
  pro_monthly: 999 * 100,  
  pro_yearly: 9990 * 100,  
};

exports.createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const amount = PLAN_AMOUNTS[plan];

    if (!amount) {
      return next(new AppError('Invalid plan selected', 400));
    }

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { plan },
    };

    const order = await razorpay.orders.create(options);

    return sendSuccess(res, 200, 'Order created successfully', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    next(new AppError('Failed to create order', 500));
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (isAuthentic) {
      await User.findByIdAndUpdate(userId, { role: 'PRO' });

      return sendSuccess(res, 200, 'Payment verified successfully. You are now a Premium user.');
    } else {
      return next(new AppError('Invalid payment signature', 400));
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    next(new AppError('Failed to verify payment', 500));
  }
};
