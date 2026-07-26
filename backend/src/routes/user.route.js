const express = require("express");
const { signUpUser, loginUser, logoutUser } = require("../controllers/user.controller");
const { purchasedCourses } = require("../controllers/user.controller");
const userMiddleware = require("../middleware/user.middleware");

const router = express.Router();

router.post("/signup", signUpUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

router.get("/purchases", userMiddleware, purchasedCourses);
module.exports = router;