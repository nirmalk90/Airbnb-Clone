const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing, validateObjectId } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage, isCloudinaryConfigured } = require("../cloudConfig.js");
const ExpressError = require("../utils/ExpressError.js");

const upload = multer({ storage });

// Turns multer/Cloudinary upload problems into readable 400s instead of 500s,
// and gives a clear message when the Cloudinary credentials are missing.
const handleUpload = (field) => (req, res, next) => {
    const uploader = upload.single(field);
    uploader(req, res, (err) => {
        if (!err) {
            return next();
        }
        if (!isCloudinaryConfigured) {
            return next(new ExpressError(
                503,
                "Image upload is not configured on this server yet. Add CLOUD_NAME, CLOUD_API_KEY and CLOUD_API_SECRET to the environment."
            ));
        }
        if (err instanceof multer.MulterError) {
            return next(new ExpressError(400, `Upload failed: ${err.message}`));
        }
        return next(new ExpressError(400, `Upload failed: ${err.message || "invalid image file"}`));
    });
};

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        handleUpload("listing[image][url]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );

// New Route
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
        handleUpload("listing[image][url]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        validateObjectId,
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListing)
    );

// Edit Route
router.get("/:id/edit",
    validateObjectId,
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;
