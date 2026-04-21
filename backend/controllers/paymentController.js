import Payment from '../models/paymentModel.js';
import Cart from '../models/Cart.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─────────────────────────────────────────────
// CREATE PAYMENT INTENT
// Called when the user clicks "Checkout" on the cart
// ─────────────────────────────────────────────
export const createPayment = async (req, res) => {
  try {
    const customerId = req.user.userid;
    const { OwnerId } = req.body;

    if (!OwnerId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    // Get the customer's cart
    const cart = await Cart.findOne({ user_id: customerId }).populate("items.product_id");
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    // Ensure cart is not empty
    if (cart.isEmptyCart()) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Please add items before checkout.",
      });
    }

    // Recalculate total to ensure it's up to date
    cart.calculateTotal();
    const totalAmount = cart.totalPrice;

    // Check if a pending payment already exists for this cart
    const existingPayment = await Payment.findOne({
      cartId: cart._id,
      status: "pending",
    });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "A pending payment already exists for this cart.",
      });
    }

    const paymentDate = new Date(Date.now());

    // Platform fee calculation (10%)
    const platformFee = totalAmount * 0.1;
    const payableAmount = totalAmount - platformFee;

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(payableAmount * 100), // Stripe uses cents
      currency: "usd",
      metadata: {
        cartId: cart._id.toString(),
        customerId: customerId.toString(),
        OwnerId: OwnerId.toString(),
      },
    });

    // Save payment record to DB
    const newPayment = await Payment.create({
      customerId,
      OwnerId,
      cartId: cart._id,
      amount: {
        amount: payableAmount,
        platformFee,
        currency: "USD",
        paymentMethod: "card",
      },
      paymentDate,
      stripePaymentIntentId: paymentIntent.id,
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully.",
      paymentId: newPayment._id,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error("createPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Server Side Error.",
    });
  }
};

// ─────────────────────────────────────────────
// STRIPE WEBHOOK
// Handles payment_intent events from Stripe
// NOTE: Route must use express.raw() — already set in server.js
// ─────────────────────────────────────────────
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // ✅ PAYMENT SUCCEEDED
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;

      const existingPayment = await Payment.findOne({
        stripePaymentIntentId: intent.id,
      });

      if (existingPayment) {
        existingPayment.status = "paid";
        await existingPayment.save();

        // NOTE: Order placement is handled separately by another module.
        // The order service should listen for payments with status "paid"
        // and cartId to create the order after this webhook fires.
        console.log(`Payment ${existingPayment._id} marked as paid. Order placement is handled externally.`);
      }
    }

    // ❌ PAYMENT FAILED
    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;

      await Payment.findOneAndDelete({
        stripePaymentIntentId: intent.id,
      });

      console.log(`Payment record deleted for failed intent: ${intent.id}`);
    }

    // ❌ PAYMENT CANCELED
    if (event.type === "payment_intent.canceled") {
      const intent = event.data.object;

      await Payment.findOneAndDelete({
        stripePaymentIntentId: intent.id,
      });

      console.log(`Payment record deleted for canceled intent: ${intent.id}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error("Webhook handling error:", error);
    res.status(500).json({ message: "Webhook error" });
  }
};

// ─────────────────────────────────────────────
// GET PAYMENTS BY LOGGED-IN CUSTOMER
// ─────────────────────────────────────────────
export const getPaymentsByUserId = async (req, res) => {
  try {
    const userId = req.user.userid;

    const payments = await Payment.find({ customerId: userId })
      .populate({
        path: "cartId",
        populate: {
          path: "items.product_id",
          select: "name price images",
        },
      })
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      message: "Payments fetched successfully.",
      payments,
    });
  } catch (error) {
    console.error("getPaymentsByUserId error:", error);
    res.status(500).json({
      success: false,
      message: "Server Side Error.",
    });
  }
};

// ─────────────────────────────────────────────
// GET ALL PAID PAYMENTS — ADMIN VIEW
// Supports filtering by date range, customerId, and pagination
// ─────────────────────────────────────────────
export const getAllPaidPaymentsForAdmin = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10, page = 1, customerId } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    let filter = { status: "paid" };

    if (customerId) {
      filter.customerId = customerId;
    }

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate({
        path: "cartId",
        populate: {
          path: "items.product_id",
          select: "name price images",
        },
      })
      .populate({ path: "customerId", select: "name email" })
      .populate({ path: "OwnerId", select: "name email" })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limitNumber);

    const totalCount = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Paid payments fetched successfully for admin.",
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
        totalItems: totalCount,
        itemsPerPage: limitNumber,
      },
      payments,
    });
  } catch (error) {
    console.error("getAllPaidPaymentsForAdmin error:", error);
    res.status(500).json({
      success: false,
      message: "Server Side Error.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// GET ALL PAID PAYMENTS — STORE OWNER VIEW
// Returns payments where OwnerId matches the logged-in owner
// ─────────────────────────────────────────────
export const getPaidPaymentsForOwner = async (req, res) => {
  try {
    const ownerId = req.user.userid;
    const { startDate, endDate, limit = 10, page = 1 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    let filter = { status: "paid", OwnerId: ownerId };

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate({
        path: "cartId",
        populate: {
          path: "items.product_id",
          select: "name price images",
        },
      })
      .populate({ path: "customerId", select: "name email" })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limitNumber);

    const totalCount = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Paid payments fetched successfully for owner.",
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
        totalItems: totalCount,
        itemsPerPage: limitNumber,
      },
      payments,
    });
  } catch (error) {
    console.error("getPaidPaymentsForOwner error:", error);
    res.status(500).json({
      success: false,
      message: "Server Side Error.",
      error: error.message,
    });
  }
};