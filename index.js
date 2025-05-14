import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import bodyParser from "body-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;
app.set("views", path.join(__dirname, "views"));

// Middleware setup
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


// Session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Set EJS view engine and public directory
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.use(express.static("public"));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Routes

// GET: Registration page
app.get("/register", (req, res) => {
  res.render("register");
});

// POST: Handle registration
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("❌ This email is already registered.");
  }

  const hashedPassword = await bcryptjs.hash(password, 10);

  try {
    await User.create({ name, email, password: hashedPassword });
    res.redirect("/");
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).send("Error registering user.");
  }
});

// GET: Login page
app.get("/", (req, res) => {
  res.render("login");
});

// POST: Handle login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("❌ Email not found.");
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send("❌ Incorrect password.");
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.redirect("/home");
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET: Home page (after login)
app.get("/home", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.render("home", { user: req.session.user });
});

// GET: Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("❌ Failed to log out");
    }
    res.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
