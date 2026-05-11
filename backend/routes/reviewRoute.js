const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const auth = require("../middleware/auth");

router.post("/", auth, reviewController.addReview);
router.put("/:id", auth, reviewController.updateReview);
router.delete("/:id", auth, reviewController.deleteReview);

router.get("/product/:product_id", reviewController.getProductReviews);
router.get("/average/:product_id", reviewController.getAverageRating);

module.exports = router;