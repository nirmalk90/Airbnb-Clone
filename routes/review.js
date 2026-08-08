const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const {
    validateReview,
    isLoggedIn,
    isReviewAuthor,
    validateObjectId
    } = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

//Post Route
router.post("/", 
    validateObjectId,
    isLoggedIn,
    validateReview, 
    wrapAsync(reviewController.createReview)
);

// Delete Route
router.delete("/:reviewId", 
    validateObjectId,
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.destroyReview)
);

module.exports = router;