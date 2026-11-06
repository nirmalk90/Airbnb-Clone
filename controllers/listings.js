const Listing = require("../models/listing.js");

const DEFAULT_IMAGE = {
    url: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
};

// Builds the image object safely: uploading a file is optional.
const imageFromRequest = (file) =>
    file ? { url: file.path, filename: file.filename } : null;

module.exports.index = async (req, res) => {
    const { q, category } = req.query;
    const query = {};
    if (category) {
        query.category = category;
    }
    if (q) {
        const safe = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$or = [
            { title: { $regex: safe, $options: "i" } },
            { location: { $regex: safe, $options: "i" } },
            { country: { $regex: safe, $options: "i" } },
            { description: { $regex: safe, $options: "i" } }
        ];
    }
    const allListings = await Listing.find(query);
    res.render("listings/index.ejs", {
        allListings,
        selectedCategory: category || "",
        searchVal: q || ""
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = imageFromRequest(req.file) || { ...DEFAULT_IMAGE };
    await newListing.save();
    req.flash("success", "New listing created successfully!");
    res.redirect("/");
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/");
    }

    const imageUrl = listing.image?.url || DEFAULT_IMAGE.url;
    const originalImageUrl = imageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/");
    }

    const image = imageFromRequest(req.file);
    if (image) {
        listing.image = image;
        await listing.save();
    }

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/");
    }
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/");
};
