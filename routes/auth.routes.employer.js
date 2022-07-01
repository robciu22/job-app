const router = require("express").Router();
const jwt = require("jsonwebtoken");
const fileUploader = require("../config/cloudinary.config");

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const { isAuthenticated } = require("../middleware/jwt.middleware");

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10;

// Require the User model in order to interact with the database
const Job = require("../models/Job.model");
const Employer = require("../models/Employer.model");
const { findByIdAndUpdate } = require("../models/Employer.model");

router.post("/employer/signup", (req, res) => {
  const { password, email, username } = req.body;
  console.log("here is employer signup", req.body);
  if (!email) {
    return res
      .status(400)
      .json({ errorMessage: "Please provide your username." });
  }

  // Search the database for a user with the username submitted in the form
  Employer.findOne({ email }).then((found) => {
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
        return Employer.create({
          email,
          username: username,

          password: hashedPassword,
        }).then((employer)=>{
res.status(200).json(employer)
        })
      })
      .catch((error) => {
        console.log(error)
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

//<<<<<<<<<<<<<<<<<<L O G I N >>>>>>>>>>>>>>>>>

router.post("/employer/login", (req, res) => {
  const { email, password, username } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ errorMessage: "Please provide your username." });
  }
  // Search the database for a user with the username submitted in the form
  Employer.findOne({ email })
    .then((user) => {
      // If the user isn't found, send the message that user provided wrong credentials
      if (!user) {
        return res.status(400).json({ errorMessage: "Wrong credential find." });
      }

      // If user is found based on the username, check if the in putted password matches the one saved in the database
      bcrypt.compare(password, user.password).then((isSamePassword) => {
        if (!isSamePassword) {
          return res
            .status(400)
            .json({ errorMessage: "Wrong credentials bycryt." });
        }
        if (isSamePassword) {
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
        } else {
          res.status(401).json({ message: "Unable to authenticate the user" });
        }
      });
    })

    .catch((err) => {
      next(err);
      // return res.status(500).render("login", { errorMessage: err.message });
    });
});

router.delete("/employer/logout", (req, res) => {
  Session.findByIdAndDelete(req.headers.authorization)
    .then(() => {
      res.status(200).json({ message: "User was logged out" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ errorMessage: err.message });
    });
});

router.post("/postjob", async (req, res, next) => {
  try {
    const { title, description, location, price } = req.body;
    const newJob = { title, description, location, price: Number(price) };
    const createdJob = await Job.create(newJob);
    console.log(createdJob);
    res.status(200).json(createdJob);
  } catch {
    console.log("Unable to create job");
  }
});
router.get("/jobs", async (req, res) => {
  const jobOffers = await Job.find();
  res.status(200).json({ jobOffers });
  console.log(jobOffers);
});

router.get("/jobs/:jobId", async (req, res) => {
  console.log("here is update", req.params);
  const { jobId } = req.params;
  let updatejob = await Job.findById(jobId);
  console.log("here is the updated jobs", updatejob);
  res.status(200).json(updatejob);
});

router.put("/updatejob/:jobId", async (req, res) => {
  const updateJob = await Job.findByIdAndUpdate(req.params.jobId, req.body);
  console.log("new update", updateJob);
  res.status(200).json(updateJob);
});

router.delete("/job/delete/:jobId", async (req, res) => {
  const deleteJob = await Job.findByIdAndDelete(req.params.jobId);
  res.status(200).json(deleteJob);
});

///////////////////////Cloudinary setup//////////////////////
router.get("/employer/photo", (req, res, next) => {
  Employer.find()
    .then((PhotosFromDB) => res.status(200).json(PhotosFromDB))
    .catch((err) => next(err));
});

// POST "/api/upload" => Route that receives the image, sends it to Cloudinary via the fileUploader and returns the image URL
router.post(
  "/employer/upload",
  fileUploader.single("imageUrl"),
  (req, res, next) => {
    // console.log("file is: ", req.file)

    if (!req.file) {
      next(new Error("No file uploaded!"));
      return;
    }

    // Get the URL of the uploaded file and send it as a response.
    // 'fileUrl' can be any name, just make sure you remember to use the same when accessing it on the frontend

    res.json({ fileUrl: req.file.path });
  }
);

// POST '/api/movies' => for saving a new movie in the database
router.post("/employer/images", (req, res, next) => {
  "body: ", req.body;
  // the fields have the same names as the ones in the model so we can simply pass
  // req.body to the .create() method

  Employer.create(req.body)
    .then((createdImage) => {
      // console.log('Created new movie: ', createdMovie);
      res.status(200).json(createdImage);
    })
    .catch((err) => next(err));
});

module.exports = router;
