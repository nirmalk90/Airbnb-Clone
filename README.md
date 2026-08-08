# Airbnb Clone

Airbnb Clone is a full-featured Airbnb clone web application built using **Node.js, Express, MongoDB, and Bootstrap 5**. It provides a robust platform for listing, exploring, and reviewing properties around the world. Users can register, log in, post their own property listings (complete with image uploads powered by Cloudinary), write reviews with star ratings, filter properties by category, and view listing locations dynamically integrated with OpenStreetMap.

---

## 🌟 Core Features

- **User Authentication & Authorization**: 
  - Secure sign-up, login, and logout functionalities utilizing Passport.js.
  - Route protections ensuring only authenticated users can create listings or post reviews.
  - Strict ownership rules (only listing owners can edit/delete listings; only review authors can delete their reviews).
- **Listing Management (CRUD)**: 
  - Host new listings with details such as Title, Description, Image, Price, Location, Country, and Category.
  - Edit or delete owned listings.
- **Dynamic Image Upload**:
  - Direct image hosting integrations using **Cloudinary** and **Multer** for seamless image upload and responsive resizing.
- **Interactive Review System**:
  - Users can post reviews with comments and star ratings (styled with the `starability` CSS widget library).
- **Interactive Mapping**:
  - Integration with **Leaflet JS** and **OpenStreetMap (Nominatim Geocoding API)** to automatically render the property's location on an interactive map.
- **Category Filter System**:
  - Browse properties categorized under specific themes such as *Trending, Rooms, Iconic Cities, Mountains, Castles, Pools, Camping, Farms, and Arctic*.
- **Tax Toggle**:
  - Dynamically switches the view to show the total price including or excluding a 18% GST tax rate.
- **Persistent Theme Toggle (Dark Mode)**:
  - Supports light/dark mode with preferences saved in `localStorage` to persist across sessions.
- **Server-Side Validation**:
  - Safe request inputs guarded by **Joi** schema validation rules to prevent dirty database states.

---

## 🛠️ Tech Stack

- **Frontend**: EJS (Embedded JavaScript templates), [ejs-mate](https://github.com/redSift/ejs-mate) (layouts), Bootstrap 5, FontAwesome, Starability CSS, Leaflet JS & OpenStreetMap.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (local or Atlas) with Mongoose (ODM).
- **Authentication**: Passport.js with Passport-Local and Passport-Local-Mongoose.
- **File Uploads**: Multer & Multer-Storage-Cloudinary.
- **Image Hosting**: Cloudinary.
- **Validation**: Joi (Object schema validation).

---

## 📂 Project Structure

```text
Airbnb Clone/
├── controllers/          # Business logic handlers for listings, reviews, and users
│   ├── listings.js
│   ├── reviews.js
│   └── users.js
├── init/                 # Database initialization and seeding scripts
│   ├── data.js           # Predefined mock listing data
│   └── index.js          # Script to seed database
├── models/               # Mongoose database models
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── public/               # Static assets served publically
│   ├── css/
│   │   ├── rating.css    # Starability rating layout rules
│   │   └── style.css     # General style rules & custom theme configurations
│   └── js/
│       └── script.js     # Form validation and Dark Mode theme toggler logic
├── routes/               # Express routing tables
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── utils/                # Utilities and custom error definitions
│   ├── ExpressError.js
│   └── wrapAsync.js
├── views/                # EJS Template files for the user interface
│   ├── bookings/         # Booking views (future implementation)
│   ├── includes/         # Reusable layouts (navbar, footer, flash alerts)
│   │   ├── flash.ejs
│   │   ├── footer.ejs
│   │   └── navbar.ejs
│   ├── layouts/          # Main application wrapper
│   │   └── boilerplate.ejs
│   ├── listings/         # Listing views (index, show, new, edit)
│   │   ├── edit.ejs
│   │   ├── index.ejs
│   │   ├── new.ejs
│   │   └── show.ejs
│   └── users/            # Auth views (login, signup)
│       ├── login.ejs
│       └── signup.ejs
├── .env                  # Environment configurations (API keys & db connections)
├── app.js                # Main Express application driver
├── cloudConfig.js        # Cloudinary setup and multer configuration
├── middleware.js         # Security and custom routing middleware checks
├── package.json          # Dependency packages and run scripts
└── schema.js             # Joi schema validations
```

---

## ⚙️ Environment Variables Setup

Before running the application, create a `.env` file in the root directory of the project and populate it with the following configuration details:

```env
# Cloudinary Credentials (for listing image uploads)
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# MongoDB Connection String (Local or Atlas)
ATLASDB_URL=mongodb://127.0.0.1:27017/wanderlust

# Session Secret (For express-session encryption)
SECRET=your_session_encryption_secret_phrase
```

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (recommended version: v24.15.0 or stable LTS) and [MongoDB](https://www.mongodb.com/) installed and running on your system.

### 2. Install Dependencies
Navigate into your project folder and run:
```bash
npm install
```

### 3. Seed the Database
To populate your MongoDB database with the initial mock listings:
```bash
npm run seed
```
*(Note: If you run into issues on older Node versions, you can use `npm run seed:legacy`)*

### 4. Start the Application
To launch the local development server:
```bash
npm start
```
*(Note: If you run into compatibility or TLS issues on older Node versions, you can use `npm run start:legacy`)*

Once started, open your web browser and navigate to:
```
http://localhost:8080
```

---

## 🔌 API Route Map

### User Routes (`/`)
- `GET /signup` - Renders signup form.
- `POST /signup` - Registers a new user.
- `GET /login` - Renders login form.
- `POST /login` - Authenticates user.
- `GET /logout` - Logs out user session.

### Listing Routes (`/`)
- `GET /` - Fetches and displays listings (supports search filter `q` and category filter `category`).
- `POST /` - Creates a new listing (requires authentication, parses uploaded file).
- `GET /new` - Renders form to add a new listing.
- `GET /:id` - Displays details of a specific listing (including Leaflet map and reviews).
- `PUT /:id` - Updates an existing listing (requires ownership).
- `DELETE /:id` - Deletes a listing and its reviews (requires ownership).
- `GET /:id/edit` - Renders edit form for a listing (requires ownership).

### Review Routes (`/:id/reviews`)
- `POST /` - Submits a review and rating for a listing (requires authentication).
- `DELETE /:reviewId` - Removes a review (requires author ownership).

---

## 🛠️ Key Database Schemas

### Listing Model
- `title`: String (Required)
- `description`: String
- `image`: Object containing `filename` (String) and `url` (String with default unsplash fallback)
- `price`: Number
- `location`: String
- `country`: String
- `category`: String (Enum: `Trending`, `Rooms`, `Iconic Cities`, `Mountains`, `Castles`, `Amazing Pools`, `Camping`, `Farms`, `Arctic`)
- `reviews`: Array of References (`Review` ObjectIds)
- `owner`: Reference (`User` ObjectId)

### Review Model
- `comment`: String
- `rating`: Number (Range: 1-5)
- `createdAt`: Date (Default: current timestamp)
- `author`: Reference (`User` ObjectId)

### User Model
- `email`: String (Required, Unique)
- Username, hash, and salt are added automatically via the `passport-local-mongoose` plugin.

---

## 🤝 Contributing

Contributions are welcome! If you find bugs or want to add enhancements (such as completing the Booking system), feel free to fork the repository, make your changes, and submit a Pull Request.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
