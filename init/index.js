const path = require('path');

require('dotenv').config({
    quiet: true,
    path: process.env.DOTENV_CONFIG_PATH || path.join(__dirname, '..', '.env')
});
const mongoose = require('mongoose');

const initData = require('./data.js');
const Listing = require('../models/listing.js');
const User = require('../models/user.js');

const MONGO_URL = process.env.ATLASDB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wanderlust';

const getCategory = (title, description) => {
    const text = ((title || '') + ' ' + (description || '')).toLowerCase();
    if (text.includes('pool')) return 'Amazing Pools';
    if (text.includes('castle') || text.includes('fort') || text.includes('palace')) return 'Castles';
    if (text.includes('mountain') || text.includes('hill') || text.includes('cabin') || text.includes('retreat')) return 'Mountains';
    if (text.includes('farm') || text.includes('cow') || text.includes('rural')) return 'Farms';
    if (text.includes('arctic') || text.includes('snow') || text.includes('ice') || text.includes('ski')) return 'Arctic';
    if (text.includes('camp') || text.includes('tent') || text.includes('glamp')) return 'Camping';
    if (text.includes('loft') || text.includes('room') || text.includes('apartment') || text.includes('flat') || text.includes('studio')) return 'Rooms';
    if (text.includes('city') || text.includes('downtown') || text.includes('urban') || text.includes('metropolitan')) return 'Iconic Cities';
    return 'Trending';
};

// Returns an existing owner, or creates a demo account on a fresh database.
// (The previous version fell back to a hardcoded ObjectId that does not exist,
// which produced listings nobody could ever edit or delete.)
const resolveOwner = async () => {
    const firstUser = await User.findOne({});
    if (firstUser) {
        console.log(`Using existing user as owner: ${firstUser.username} (${firstUser._id})`);
        return firstUser._id;
    }

    const username = process.env.SEED_USERNAME || 'demo';
    const password = process.env.SEED_PASSWORD || 'wanderlust123';
    const email = process.env.SEED_EMAIL || 'demo@wanderlust.local';

    console.log(`No users found — creating demo owner "${username}" (change the password after signing in).`);
    const demoUser = await User.register(new User({ username, email }), password);
    return demoUser._id;
};

const initDB = async () => {
    await Listing.deleteMany({});

    const ownerId = await resolveOwner();
    const listings = initData.data.map((obj) => ({
        ...obj,
        owner: ownerId,
        category: getCategory(obj.title, obj.description)
    }));

    await Listing.insertMany(listings);
    console.log(`Database initialized successfully: ${listings.length} listings seeded.`);
};

async function main() {
    await mongoose.connect(MONGO_URL, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
    });
    console.log('Connected to MongoDB');
    await initDB();
}

main()
    .then(async () => {
        await mongoose.connection.close();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error('Error seeding database:', err.message || err);
        try {
            await mongoose.connection.close();
        } catch (_) {
            // ignore
        }
        process.exit(1);
    });
