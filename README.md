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

Configuration is read from the process environment first, then from a local `.env` file. The `.env` file is loaded in **every** environment (production included) so a stray `NODE_ENV` can never leave the app without credentials — and real environment variables always take precedence over the file.

Copy the template and fill in the values:

```bash
cp .env.example .env
```

```env
# Required
ATLASDB_URL=mongodb://127.0.0.1:27017/wanderlust   # or a MongoDB Atlas connection string
SECRET=your_session_encryption_secret_phrase        # long random string

# Optional — required only for image uploads
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Optional
PORT=8080                # hosting platforms inject this automatically
NODE_ENV=production      # set by most hosting platforms
```

The app validates this configuration at boot and **fails fast** with an actionable message instead of crashing later:

| Situation | Behaviour |
| --- | --- |
| `ATLASDB_URL` / `SECRET` missing | Prints `Missing required environment variable(s)`, exits `1` |
| `ATLASDB_URL` still contains `<password>` / `[user]` | Refused with a placeholder warning, exits `1` |
| MongoDB unreachable | Prints a single `[fatal] Failed to start` line (no raw driver stack trace), exits `1` — the deploy turns red instead of serving 500s |
| Cloudinary keys missing | Warns at boot; the app still runs, uploads return a readable `503` |

---

## 🔁 Deployment

The app is deploy-agnostic: it reads `process.env.PORT`, binds to `0.0.0.0`, loads `.env` from its own directory (not the cwd), trusts one proxy hop for secure cookies in production, and exits non-zero if it cannot reach MongoDB.

### Render (blueprint included)

`render.yaml` is committed, so you can use **New → Blueprint** and just fill in the secrets. Or create the service manually:

| Setting | Value |
| --- | --- |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/healthz` |
| Environment | `ATLASDB_URL`, `SECRET`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` |

### Railway / Heroku / Fly / VPS

- **Railway:** deploy the repo, add the variables above; `PORT` is injected automatically.
- **Heroku:** `Procfile` is included (`web: node app.js`).
- **Fly/VPS:** run `npm ci --omit=dev && npm start` with the same variables exported.

### MongoDB Atlas checklist

1. Create a cluster and a database user.
2. **Network Access** → add `0.0.0.0/0` (or the host's static egress IP if you have one). This is the single most common cause of a deploy that starts but every page fails.
3. Copy the connection string into `ATLASDB_URL` (keep the `/wanderlust` database name).
4. Optionally seed once: `npm run seed` from a machine that can reach the cluster.

### Health check

`GET /healthz` returns `200` when the MongoDB connection is up, otherwise `503`:

```json
{ "status": "ok", "db": "connected", "uptime": 42 }
```

Use it as the platform health-check path and for uptime monitoring.

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (Node.js 22 or newer — `engines` is `>=22`, `.nvmrc` pins 22) and [MongoDB](https://www.mongodb.com/) installed and running on your system.

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
If the database has no users yet, the seed script creates a demo owner (`SEED_USERNAME` / `SEED_PASSWORD` / `SEED_EMAIL` env vars, defaulting to `demo` / `wanderlust123`) so every listing has a real owner.

### 4. Start the Application
```bash
npm start
```
The server starts only after MongoDB is reachable, and listens on `PORT` (default `8080`):

```
Connected to MongoDB (mongoose)
Connected to MongoDB (session store)
Server is running on port 8080 (NODE_ENV=development)
```

Once started, open your web browser and navigate to:
```
http://localhost:8080
```

### 5. Run the tests
```bash
npm test
```
The suite boots the app and covers routing/rendering (including `/healthz` and the 404 page) plus the startup guards: missing variables, placeholder connection strings, and an unreachable database all exit non-zero without opening a port. No MongoDB instance is required.

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
