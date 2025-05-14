import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import bodyParser from 'body-parser';


const app=express()
dotenv.config();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
const Port = process.env.PORT || 3000;

//set view engine
app.set('view engine', 'ejs');




//connetion to mongodb
mongoose.connect("mongodb://localhost:27017/login-data")
.then(()=>{
    console.log("Connected to MongoDB");   
})
.catch((err)=>{
    console.log("Error connecting to MongoDB", err);
})  

//user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});



const User = mongoose.model("User", userSchema);

app.get("/register", (req, res) => {
    res.render("register"); // create register.ejs
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await User.create({ name, email, password: hashedPassword });
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.send("Error registering user.");
    }
});





app.get("/",(req,res)=>{
    res.render("login");
})
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.redirect("/");
        }

        // If password is hashed (recommended)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.redirect("/");
        }


        return res.redirect("/home");

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).send("Internal Server Error");
    }
}); 

app.get("/home",(req,res)=>{
    res.render("home");
})






app.listen(Port,()=>{  console.log("server is connected",Port); })
