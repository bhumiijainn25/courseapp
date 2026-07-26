const express = require("express");
const { createCourse, updateCourse, deleteCourse, getAllCourses, getCourseById, buyCourses, verifyPayment, demoPurchase} = require("../controllers/course.controller");   
const userMiddleware = require("../middleware/user.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const router = express.Router();

router.post("/create",adminMiddleware, createCourse);
router.patch("/update/:courseId", adminMiddleware, updateCourse);
router.delete("/delete/:courseId", adminMiddleware, deleteCourse);
router.get("/courses", getAllCourses);
router.get("/courses/:courseId", getCourseById);

router.post("/buy/:courseId",userMiddleware, buyCourses);

router.post(
    "/verify-payment",
    userMiddleware,
    verifyPayment
);
router.post(
    "/demo-buy/:courseId",
    userMiddleware,
    demoPurchase
);

module.exports = router;