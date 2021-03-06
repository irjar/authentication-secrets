//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// initialise the session
app.use(session({
  secret: "Our little secret.", // use it to sign the session ID cookie
  resave: false, // do not force the session to be saved back to the session store
  saveUninitialized: false // do not force a session that is "uninitialized" to be saved to the store
}));

// initialise passport for authentication and use it for the session
app.use(passport.initialize());
app.use(passport.session());

// connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

// add a plugin to the schema to hash and salt passwords
userSchema.plugin(passportLocalMongoose);
// a plugin to find or create a user using details sent by Google
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Google authentication strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

// initiate the authentication with google; use passport to
// authenticate the user using the google strategy
app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile"]
}));

// get request from google redirecting the user to the secrets page
app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect('/secrets');
  });


app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

// search the database for secret fields that is not null
app.get("/secrets", function(req, res){
  User.find({"secret":{$ne: null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    } else {
      res.render("secrets", {usersWithSecrets: foundUsers})
    }
  });
});

app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

// de-authenticate the user and end the user session
app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});
/////////////////////////register route///////////////////////////////////
app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
      // if the authentication of the user is successful and
      // the cookie was set up that saved the user currect session
      // and we can check if they are logged in or not
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      })
    }
  })
});

/////////////////////////////login route////////////////////////////////////////////

// check if the user credentials are in the database
app.post("/login", function(req, res) {
   const user = new User({
     username: req.body.username,
     password: req.body.password
   });
   // use passport to log in the user and authenticate them
   req.login(user, function(err){
     if(err){
       console.log(err);
     } else {
          // send a cookie with information about the user for authentication
          // and tell the browser to hold on to that cookie
       passport.authenticate("local")(req, res, function(){
         res.redirect("/secrets");
       })
     }
   });
});

app.listen(3000, function() {
  console.log("Server started on port 3000.");
})
