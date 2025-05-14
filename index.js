import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import bodyParser from "body-parser";
import session from "express-session";

const app = express();
dotenv.config();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
const Port = process.env.PORT || 3000;

//set view engine
app.set("view engine", "ejs");

app.use(
  session({
    secret: "your-secret-key", // Secret to sign the session ID
    resave: false, // Don't save session if it's not modified
    saveUninitialized: false, // Don't create session until something is stored
  })
);

//connetion to mongodb
async function connectDB() {
  await mongoose
    .connect("mongodb+srv://ap195569:ap195569@user-login.08fwlb9.mongodb.net/?retryWrites=true&w=majority&appName=user-login")
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.log("Error connecting to MongoDB", err);
    });
}
connectDB();

//user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

app.get("/register", (req, res) => {
  res.render("register"); // create register.ejs
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcryptjs.hash(password, 10);

  try {
    await User.create({ name, email, password: hashedPassword });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("Error registering user.");
  }
});

app.get("/", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect("/");
    }

    // If password is hashed (recommended)
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.redirect("/");
    }

    return res.redirect("/home");
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/home", (req, res) => {
  if (!req.session.user) {
    // If the user is not logged in, redirect to login
    return res.redirect("/");
  }
  res.render("home", { user: req.session.user });
});

app.get("/logout", (req, res) => {
  // Destroy the session to log out the user
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Failed to log out");
    }
    res.redirect("/"); // Redirect to the login page after logout
  });
});

app.listen(Port, () => {
  console.log("server is connected", Port);
});
