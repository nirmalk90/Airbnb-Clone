const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const initData = require('./data.js');
const Listing = require('../models/listing.js');
const User = require('../models/user.js');

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() =>{
        console.log("Connected to MongoDB");
        return initDB();
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });

async function main() {
    await mongoose.connect(MONGO_URL, {
        tlsAllowInvalidCertificates: true
    });
}

const getCategory = (title, description) => {
    const text = ((title || "") + " " + (description || "")).toLowerCase();
    if (text.includes("pool")) return "Amazing Pools";
    if (text.includes("castle") || text.includes("fort") || text.includes("palace")) return "Castles";
    if (text.includes("mountain") || text.includes("hill") || text.includes("cabin") || text.includes("retreat")) return "Mountains";
    if (text.includes("farm") || text.includes("cow") || text.includes("rural")) return "Farms";
    if (text.includes("arctic") || text.includes("snow") || text.includes("ice") || text.includes("ski")) return "Arctic";
    if (text.includes("camp") || text.includes("tent") || text.includes("glamp")) return "Camping";
    if (text.includes("loft") || text.includes("room") || text.includes("apartment") || text.includes("flat") || text.includes("studio")) return "Rooms";
    if (text.includes("city") || text.includes("downtown") || text.includes("urban") || text.includes("metropolitan")) return "Iconic Cities";
    return "Trending";
};

const initDB = async () => {
    try {
        await Listing.deleteMany({});
        
        let defaultOwner = "6a2dbd3219300d0b132fbc9d";
        const firstUser = await User.findOne({});
        if (firstUser) {
            defaultOwner = firstUser._id;
            console.log(`Using existing user as owner: ${firstUser.username} (${firstUser._id})`);
        } else {
            console.log(`No users found in database. Using default hardcoded owner ID: ${defaultOwner}`);
        }

        initData.data = initData.data.map((obj) => ({
            ...obj,
            owner: defaultOwner,
            category: getCategory(obj.title, obj.description)
        }));

        await Listing.insertMany(initData.data);
        console.log("Database was initialized successfully with seeded categories!");
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        mongoose.connection.close();
    }
};