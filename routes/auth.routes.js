const router = require("express").Router();
const jwt = require("jsonwebtoken");

const fileUploader = require("../config/cloudinary.config");

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10;

// Require the User model in order to interact with the database
const User = require("../models/User.model");
const Job = require("../models/Job.model");

const { isAuthenticated } = require("../middleware/jwt.middleware");

router.post("/signup", (req, res, next) => {
  console.log("here is user signup", req.body);
  const { email, username, password } = req.body;

  if (!username) {
    return res
      .status(400)
      .json({ errorMessage: "Please provide your username." });
  }

  // Search the database for a user with the username submitted in the form
  User.findOne({ username }).then((found) => {
    // If the user is found, send the message username is taken
    if (found) {
      return res.status(400).json({ errorMessage: "Username already taken." });
    }

    // if user is not found, create a new user - start with hashing the password
    return bcrypt
      .genSalt(saltRounds)
      .then((salt) => bcrypt.hash(password, salt))
      .then((hashedPassword) => {
        // Create a user and save it in the database
        return User.create({
          username,
          password: hashedPassword,
          email,
        }).then((user) => {
          res.status(200).json(user);
        });
      })

      .catch((error) => {
        if (error instanceof mongoose.Error.ValidationError) {
          return res.status(400).json({ errorMessage: error.message });
        }
        if (error.code === 11000) {
          return res.status(400).json({
            errorMessage:
              "Username need to be unique. The username you chose is already in use.",
          });
        }
        return res.status(500).json({ errorMessage: error.message });
      });
  });
});

router.post("/login", (req, res, next) => {
  const { email, username, password } = req.body;
  console.log("new login", req.body);
  if (!username) {
    return res
      .status(400)
      .json({ errorMessage: "Please provide your username." });
  }

  // Search the database for a user with the username submitted in the form
  User.findOne({ username })
    .then((user) => {
      // If the user isn't found, send the message that user provided wrong credentials
      if (!user) {
        return res.status(400).json({ errorMessage: "Wrong credentials." });
      }
      User.findOne({ email }).then((email) => {
        console.log(email, user);
        if (!email) {
          return res.status(404).json({ errorMessage: "User not found." });
        }
      });

      // If user is found based on the username, check if the in putted password matches the one saved in the database
      bcrypt.compare(password, user.password).then((isSamePassword) => {
        if (!isSamePassword) {
          return res.status(400).json({ errorMessage: "Wrong credentials." });
        } else {
          // Deconstruct the user object to omit the password
          const { _id, email, name } = user;

          // Create an object that will be set as the token payload
          const payload = { _id, email, name };

          // Create and sign the token
          const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: "6h",
          });
          console.log("here is jwt ", authToken);
          // Send the token as the response
          res.status(200).json({ authToken: authToken });
        }
      });
    })

    .catch((err) => {
      return res.status(500).render("login", { errorMessage: err.message });
    });
});

router.delete("/user/logout", (req, res) => {
  Session.findByIdAndDelete(req.headers.authorization)
    .then(() => {
      res.status(200).json({ message: "User was logged out" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ errorMessage: err.message });
    });
});

router.get("/verify", isAuthenticated, (req, res) => {
  res.status(200).json(req.payload);
});

router.post("/likejobs", isAuthenticated, async (req, res) => {
  let currentUser = await User.findById(req.payload._id);
  if (currentUser.applyJobs.includes(req.body[0]._id)) {
    res.status(200).json({ message: "you have already liked this job" });
  } else {
    let response = await User.findByIdAndUpdate(req.payload._id, {
      $push: { applyJobs: req.body[0]._id },
    });
    res.status(200).json(response);
  }
});

router.get("/favouritejobs", isAuthenticated, async (req, res) => {
  const currentUser = await User.findById(req.payload._id).populate(
    "applyJobs"
  );
  res.status(200).json(currentUser);
});

////////////////////cloudinary setup ////////////////

module.exports = router;
