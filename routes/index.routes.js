const router = require("express").Router();
// const authRoutes = require("./auth.routes");
// const authRouteEmployers = require("./auth.routes.employer");

/* GET home page */
router.get("/", (req, res, next) => {
  res.json("All good in here");
});

// router.use("/auth", authRoutes);

// router.use("/auth", authRouteEmployers);

module.exports = router;
