const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const CLOUDINARY_ENV_KEYS = ["CLOUD_NAME", "CLOUD_API_KEY", "CLOUD_API_SECRET"];

const missing = CLOUDINARY_ENV_KEYS.filter((key) => !process.env[key]);
if (missing.length) {
    console.warn(`[warn] Cloudinary is not configured (missing: ${missing.join(", ")}). Image uploads will be rejected.`);
}

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "airbnb_DEV",
        allowedFormats: ["jpeg", "png", "jpg", "webp"]
    }
});

module.exports = {
    cloudinary,
    storage,
    isCloudinaryConfigured: missing.length === 0
};
