const express = require("express");
const { signUpAdmin, loginAdmin, logoutAdmin } = require("../controllers/admin.controller");

const router = express.Router();


router.post("/signup", signUpAdmin);
router.post("/login", loginAdmin);
router.get("/logout", logoutAdmin);

module.exports = router;