import express from 'express';
import { isBuyer,isVendor,isAdmin, requiredSignIn } from '../middlewares/authMiddleware.js';
import { createPayment, 
         getPaymentsByUserId,
         getPaidPaymentsForOwner,
         getAllPaidPaymentsForAdmin } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-payment',requiredSignIn, createPayment );
// router.post('/webhook', express.raw({type: 'application/json'}), stripeWebhook );

router.get("/get-payments", requiredSignIn, isBuyer, getPaymentsByUserId);

//owner views payments received for their vehicles
router.get("/get-paid-payments-for-owner", requiredSignIn, getPaidPaymentsForOwner);

//admin views all paid payments across the platform
router.get("/get-all-paid-payments-for-admin", requiredSignIn,isAdmin, getAllPaidPaymentsForAdmin);


export default router;