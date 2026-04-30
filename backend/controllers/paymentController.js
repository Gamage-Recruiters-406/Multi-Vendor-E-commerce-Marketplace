import Payment from '../models/paymentModel.js';
import Cart from '../models/Cart.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const calculateVendorSplits = (cartItems, platformFeeRate = 0.1) => {
    const storeMap = {};

    for (const item of cartItems) {
        const storeId = item.store_id.toString();
        const lineTotal = item.price * item.quantity;

        if (!storeMap[storeId]) {
            storeMap[storeId] = 0;
        }
        storeMap[storeId] += lineTotal;
    }

    return Object.entries(storeMap).map(([storeId, grossAmount]) => {
        const platformFee = grossAmount * platformFeeRate;
        const netAmount = grossAmount - platformFee;
        return {
            storeId,
            amount: grossAmount,
            platformFee,
            netAmount
        };
    });
};

// ─────────────────────────────────────────────
// CREATE PAYMENT INTENT
// ─────────────────────────────────────────────
export const createPayment = async (req, res) => {
    try {
        const customerId = req.user._id;

        const cart = await Cart.findOne({ user_id: customerId }).populate("items.product_id");
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        if (cart.isEmptyCart()) {
            return res.status(400).json({ success: false, message: "Cart is empty." });
        }

        cart.calculateTotal();
        const totalAmount = cart.totalPrice;

        const existingPayment = await Payment.findOne({ cartId: cart._id, status: "pending" });
        if (existingPayment) {
            return res.status(400).json({ success: false, message: "A pending payment already exists for this cart." });
        }

        const storeSplits = calculateVendorSplits(cart.items);
        const totalPlatformFee = storeSplits.reduce((sum, v) => sum + v.platformFee, 0);
        const totalPayable = storeSplits.reduce((sum, v) => sum + v.netAmount, 0);

        const paymentDate = new Date();

        const storeIds = storeSplits.map(v => v.storeId).join(",");
        const storeAmounts = storeSplits.map(v => v.netAmount.toFixed(2)).join(",");

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalPayable * 100),
          currency: "usd",
          automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never",  // ✅ this fixes the CLI confirm error
          },
          metadata: {
              cartId: cart._id.toString(),
              customerId: customerId.toString(),
              storeIds,
              storeAmounts,
          },
      });

        const newPayment = await Payment.create({
            customerId,
            cartId: cart._id,
            storePayments: storeSplits.map(v => ({   // ✅ storePayments (matches model)
                storeId: v.storeId,
                amount: v.amount,
                platformFee: v.platformFee,
                netAmount: v.netAmount,
            })),
            amount: {
                amount: totalPayable,
                platformFee: totalPlatformFee,
                currency: "USD",
                paymentMethod: "card",
            },
            paymentDate,
            stripePaymentIntentId: paymentIntent.id,
        });

        try {
            const buyer = await User.findById(customerId);
            if (buyer) {
                const itemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                await notificationService.sendToUser(buyer._id, {
                    type: 'payment_initiated',
                    title: 'Payment Initiated 💳',
                    message: `Your payment of $${totalPayable.toFixed(2)} has been initiated.`,  // ✅ fixed variable name
                    data: {
                        paymentId: newPayment._id,
                        amount: totalPayable,           // ✅ fixed variable name
                        platformFee: totalPlatformFee,  // ✅ fixed variable name
                        totalAmount,
                        itemCount,
                        storeCount: storeSplits.length,
                    },
                    sendEmail: true,
                });
            }
        } catch (notifError) {
            console.error("Create payment notification error:", notifError);
        }

        res.status(201).json({
            success: true,
            message: "Payment created successfully.",
            paymentId: newPayment._id,
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error) {
        console.error("createPayment error:", error);
        res.status(500).json({ success: false, message: "Server Side Error." });
    }
};

// ─────────────────────────────────────────────
// STRIPE WEBHOOK
// ─────────────────────────────────────────────
export const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(event.type);
    try {
        // ✅ PAYMENT SUCCEEDED
        if (event.type === "payment_intent.succeeded") {
            const intent = event.data.object;

            const existingPayment = await Payment.findOne({
                stripePaymentIntentId: intent.id,
            });

            if (existingPayment) {
                if (existingPayment.status === "paid") {
                    return res.json({ received: true });
                }

                existingPayment.status = "paid";
                await existingPayment.save();

                // Notify buyer
                try {
                    const buyer = await User.findById(existingPayment.customerId);
                    const totalAmount = Number(existingPayment.amount?.amount || 0);

                    if (buyer) {
                        await notificationService.sendToUser(buyer._id, {
                            type: "payment_succeeded",
                            title: "Payment Successful! ✅",
                            message: `Your payment of $${totalAmount.toFixed(2)} was successfully processed.`,
                            data: {
                                paymentId: existingPayment._id,
                                amount: totalAmount,
                                paymentDate: existingPayment.paymentDate,
                            },
                            sendEmail: true,
                        });
                    }
                } catch (notifError) {
                    console.error("Buyer notification error:", notifError);
                }

                // ✅ Notify each store owner individually (storePayments not vendorPayments)
                for (const storeSplit of existingPayment.storePayments) {
                    try {
                        const buyer = await User.findById(existingPayment.customerId);

                        // storeId refs "Store" model — find the owner of that store
                        const Store = (await import('../models/Store.js')).default;
                        const store = await Store.findById(storeSplit.storeId);
                        const storeOwner = store ? await User.findById(store.owner_id) : null;

                        if (storeOwner) {
                            await notificationService.sendToUser(storeOwner._id, {
                                type: "payment_received",
                                title: "Payment Received! 💰",
                                message: `You received $${storeSplit.netAmount.toFixed(2)} from ${buyer?.fullname || "a customer"}.`,
                                data: {
                                    paymentId: existingPayment._id,
                                    grossAmount: storeSplit.amount,
                                    platformFee: storeSplit.platformFee,
                                    netAmount: storeSplit.netAmount,
                                    buyerName: buyer?.fullname || "Customer",
                                    paymentDate: existingPayment.paymentDate,
                                },
                                sendEmail: true,
                            });
                        }
                    } catch (notifError) {
                        console.error(`Store ${storeSplit.storeId} notification error:`, notifError);
                    }
                }

                console.log(`✅ Payment ${existingPayment._id} marked as paid. Stores: ${existingPayment.storePayments.length}`);
            }
        }

        // ❌ PAYMENT FAILED
        if (event.type === "payment_intent.payment_failed") {
            const intent = event.data.object;
            const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });

            if (payment) {
                try {
                    const buyer = await User.findById(payment.customerId);
                    const amount = Number(payment.amount?.amount || 0);
                    if (buyer) {
                        await notificationService.sendToUser(buyer._id, {
                            type: "payment_failed",
                            title: "Payment Failed ❌",
                            message: `Your payment of $${amount.toFixed(2)} failed. Please try again.`,
                            data: { paymentId: payment._id, amount },
                            sendEmail: true,
                        });
                    }
                } catch (notifError) {
                    console.error("Failed payment notification error:", notifError);
                }

                await Payment.findOneAndDelete({ stripePaymentIntentId: intent.id });
                console.log(`❌ Payment deleted for failed intent: ${intent.id}`);
            }
        }

        // ❌ PAYMENT CANCELED
        if (event.type === "payment_intent.canceled") {
            const intent = event.data.object;
            const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });

            if (payment) {
                try {
                    const buyer = await User.findById(payment.customerId);
                    const amount = Number(payment.amount?.amount || 0);
                    if (buyer) {
                        await notificationService.sendToUser(buyer._id, {
                            type: "payment_failed",
                            title: "Payment Cancelled",
                            message: `Your payment of $${amount.toFixed(2)} was cancelled.`,
                            data: { paymentId: payment._id, amount },
                            sendEmail: true,
                        });
                    }
                } catch (notifError) {
                    console.error("Cancelled payment notification error:", notifError);
                }

                await Payment.findOneAndDelete({ stripePaymentIntentId: intent.id });
                console.log(`❌ Payment deleted for canceled intent: ${intent.id}`);
            }
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
        const userId = req.user._id;

        const payments = await Payment.find({ customerId: userId })
            .populate({
                path: "cartId",
                populate: { path: "items.product_id", select: "name price images" },
            })
            .populate("storePayments.storeId", "name")   // ✅ storePayments
            .sort({ paymentDate: -1 });

        res.status(200).json({ success: true, message: "Payments fetched successfully.", payments });
    } catch (error) {
        console.error("getPaymentsByUserId error:", error);
        res.status(500).json({ success: false, message: "Server Side Error." });
    }
};

// ─────────────────────────────────────────────
// GET ALL PAID PAYMENTS — ADMIN VIEW
// ─────────────────────────────────────────────
export const getAllPaidPaymentsForAdmin = async (req, res) => {
    try {
        const { startDate, endDate, limit = 10, page = 1, customerId } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = { status: "paid" };
        if (customerId) filter.customerId = customerId;
        if (startDate || endDate) {
            filter.paymentDate = {};
            if (startDate) filter.paymentDate.$gte = new Date(startDate);
            if (endDate) filter.paymentDate.$lte = new Date(endDate);
        }

        const payments = await Payment.find(filter)
            .populate({
                path: "cartId",
                populate: { path: "items.product_id", select: "name price images" },
            })
            .populate("customerId", "name email")
            .populate("storePayments.storeId", "name")   // ✅ storePayments
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
        res.status(500).json({ success: false, message: "Server Side Error.", error: error.message });
    }
};

// ─────────────────────────────────────────────
// GET ALL PAID PAYMENTS — STORE OWNER VIEW
// ─────────────────────────────────────────────
export const getPaidPaymentsForOwner = async (req, res) => {
    try {
        const ownerId = req.user._id;
        const { startDate, endDate, limit = 10, page = 1 } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // First find all stores owned by this user
        const Store = (await import('../models/Store.js')).default;
        const ownerStores = await Store.find({ owner_id: ownerId }).select("_id");
        const storeIds = ownerStores.map(s => s._id);

        // ✅ filter by storePayments.storeId
        let filter = {
            status: "paid",
            "storePayments.storeId": { $in: storeIds }
        };

        if (startDate || endDate) {
            filter.paymentDate = {};
            if (startDate) filter.paymentDate.$gte = new Date(startDate);
            if (endDate) filter.paymentDate.$lte = new Date(endDate);
        }

        const payments = await Payment.find(filter)
            .populate({
                path: "cartId",
                populate: { path: "items.product_id", select: "name price images" },
            })
            .populate("customerId", "name email")
            .populate("storePayments.storeId", "name")
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(limitNumber);

        const totalCount = await Payment.countDocuments(filter);

        // Attach only this owner's store share to each payment
        const paymentsWithMyShare = payments.map(payment => {
            const myShares = payment.storePayments.filter(
                s => storeIds.some(id => id.toString() === s.storeId._id?.toString())
            );
            return {
                ...payment.toObject(),
                myShare: myShares,
            };
        });

        res.status(200).json({
            success: true,
            message: "Paid payments fetched successfully for owner.",
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCount / limitNumber),
                totalItems: totalCount,
                itemsPerPage: limitNumber,
            },
            payments: paymentsWithMyShare,
        });
    } catch (error) {
        console.error("getPaidPaymentsForOwner error:", error);
        res.status(500).json({ success: false, message: "Server Side Error.", error: error.message });
    }
};