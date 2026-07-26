const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const purchaseModel = require("../models/purchase.model");
const courseModel = require("../models/course.model");


async function signUpUser(req, res) {   
    const { firstName, lastName, email, password } = req.body;

    const schema = zod.object({
        firstName: zod.string().min(3, "FirstName must be at least 3 characters long"),
        lastName: zod.string().min(3, "LastName must be at least 3 characters long"),
        email: zod.string().email("Invalid email address"),
        password: zod.string().min(6, "Password must be at least 6 characters long")
    });

    const validateData = schema.safeParse(req.body);
    if (!validateData.success) {
        const errors = validateData.error.issues.map((err) => err.message);
        return res.status(400).json({ errors });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                errors: "All fields are required"
            });
        }
        const existingUser = await userModel.findOne({
            email: email
        });
        if (existingUser) {
            return res.status(400).json({
                errors: "User already exists"
            });
        }
        const newUser = new userModel({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            message: "User created successfully",
            user: newUser
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Error in creating user"
        });
    }
}

async function loginUser(req, res) {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                errors : "All fields are required"
            });
        }

        const user = await userModel.findOne({ email });

        // Check if user exists first
        if (!user) {
            return res.status(400).json({
                errors : "Invalid credentials"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Check password
        if (!isPasswordValid) {
            return res.status(400).json({
                errors : "Invalid credentials"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        const cookieOptions = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        };

        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            message: "User logged in successfully",
            user,
            token,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            errors : "Error in logging in",
        });
    }
}



async function logoutUser(req, res) {
    try {
        if(!req.cookies.token){
            return res.status(401).json({
                errors: "Kindly login first to logout"
            })
        }
        res.clearCookie("token");   
        res.status(200).json({
            message: "User logged out successfully"
        
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Error in logging out"
        });
    }
}



async function purchasedCourses(req, res) { 
    const userId = req.userId; // Get the userId from the request object

    try {
        const purchased = await purchaseModel.find({ userId });

        let purchasedCourseId =[];

        for(let i=0; i<purchased.length; i++){
            purchasedCourseId.push(purchased[i].courseId);
        }

        const courseData = await courseModel.find({ _id: { $in: purchasedCourseId } });

        res.status(200).json({
            message: "Purchased courses fetched successfully",
            purchased,
            courseData
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Error in fetching purchased courses"
        });
    }
}

module.exports = { signUpUser, loginUser, logoutUser, purchasedCourses };