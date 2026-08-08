const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing, validateObjectId} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single("listing[image][url]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.route("/:id")
    .get(
        validateObjectId,
        wrapAsync(listingController.showListing)
    )
    .put(
        validateObjectId,
        isLoggedIn,
        isOwner,
        upload.single("listing[image][url]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        validateObjectId,
        isLoggedIn, 
        isOwner,
        wrapAsync(listingController.destroyListing)
    );

//Edit Route
router.get("/:id/edit",
    validateObjectId,
    isLoggedIn,
    isOwner, 
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;