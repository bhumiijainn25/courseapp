const express = require('express');
const courseRoutes = require("./routes/course.route");
const userRoutes = require("./routes/user.route");
const adminRoutes = require("./routes/admin.route");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const storageService = require("./service/storage.service");
const cookieParser = require("cookie-parser");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}));


app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH","DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);

module.exports = app;