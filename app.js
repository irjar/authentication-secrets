//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const secret = process.env.SECRET;

userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
 res.render("home");
});

app.get("/login", function(req, res){
 res.render("login");
});

app.get("/register", function(req, res){
 res.render("register");
});

app.post("/register", function(req, res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    } else {
      // render the secrets route once the user is registered or logged in
      res.render("secrets");
    }
  });
});

// check if the user credentials are in the database
app.post("/login", function(req,res){
 // credentials that user input on the login page
 const username = req.body.username;
 const password = req.body.password;

 // check the typed credentials against the database
 User.findOne({email: username}, function(err, foundUser){
   if(err){
     console.log(err);
   } else {
     // if the email is found in the database, check if
     // the typed password matches the one saved in the database
     if(foundUser){
       if(foundUser.password === password){
         // if the password matches the username then render the secrets page
         res.render("secrets");
       }
     }
   }
 });
});

app.listen(3000, function(){
  console.log("Server started on port 3000.");
})
