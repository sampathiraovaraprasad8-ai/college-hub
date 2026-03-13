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

/* MIDDLEWARE */
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

/* SESSION WITH MONGO STORE */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "collegeportal",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
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
const client = new MongoClient(process.env.MONGO_URI);
let users;

async function start() {
  try {
    await client.connect();
    const db = client.db("collegePortal");
    users = db.collection("users");
    console.log("MongoDB Connected ✅");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
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

// FIRST YEAR
app.get("/first-year", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "first-year.html"));
});

// SECOND YEAR
app.get("/second-year", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "second-year.html"));
});

// THIRD YEAR
app.get("/third-year", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "third-year.html"));
});

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await users.findOne({ email });
  if (existingUser) return res.send("User already exists");

  const hash = await bcrypt.hash(password, 10);
  await users.insertOne({ email, password: hash });

  res.redirect("/");
});

// LOGIN
app.post("/login", async (req, res) => {
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
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});