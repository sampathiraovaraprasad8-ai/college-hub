// server.js
import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Variables from Environment
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 10000; // Render uses 10000 by default

/* MIDDLEWARE */
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

/* SESSION WITH MONGO STORE */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "collegeportal",
    resave: false,
    saveUninitialized: false, // Changed to false for better performance
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);

/* AUTH MIDDLEWARE */
function checkAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
}

/* MONGODB CONNECTION */
const client = new MongoClient(MONGO_URI);
let users;

async function start() {
  try {
    if (!MONGO_URI) {
        throw new Error("MONGO_URI is missing from Environment Variables!");
    }
    
    await client.connect();
    const db = client.db("collegePortal");
    users = db.collection("users");
    console.log("MongoDB Connected ✅");

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1); // Stop the server if DB fails
  }
}

start();

/* ROUTES */

// LOGIN PAGE
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.sendFile(path.join(__dirname, "public", "login.html"));
  }
});

// HOME PAGE
app.get("/home", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// OTHER PAGES
const pages = ["first-year", "second-year", "third-year"];
pages.forEach(page => {
    app.get(`/${page}`, checkAuth, (req, res) => {
        res.sendFile(path.join(__dirname, "public", `${page}.html`));
    });
});

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await users.findOne({ email });
    if (existingUser) return res.send("User already exists");

    const hash = await bcrypt.hash(password, 10);
    await users.insertOne({ email, password: hash });
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Registration failed");
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await users.findOne({ email });

    if (!user) return res.send("Invalid Email or Password");

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = email;
      return res.redirect("/home");
    } else {
      return res.send("Invalid Email or Password");
    }
  } catch (err) {
    res.status(500).send("Login failed");
  }
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});