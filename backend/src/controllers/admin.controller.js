const adminModel = require("../models/admin.model");
const bcrypt = require("bcrypt");
const zod = require("zod");
const jwt = require("jsonwebtoken");


async function signUpAdmin(req, res) {   

    
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
        const existingAdmin = await adminModel.findOne({
            email: email
        });
        if (existingAdmin) {
            return res.status(400).json({
                errors: "Admin already exists"
            });
        }
        const newAdmin = new adminModel({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        await newAdmin.save();

        res.status(201).json({
            message: "Admin created successfully",
            user: newAdmin
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Error in creating admin"
        });
    }
}


async function loginAdmin(req, res) {
   const { email, password } = req.body;

   try {
       if (!email || !password) {
           return res.status(400).json({
               errors: "All fields are required"
           });
       }

        const admin = await adminModel.findOne({ email: email });
        const isPasswordValid = await bcrypt.compare(password, admin.password);
    
        if(!admin || !isPasswordValid){
            return res.status(400).json({
                errors: "Invalid credentials"
            })
        }


        //jwt code
        const token = jwt.sign({
            id: admin._id,
        }, process.env.JWT_SECRET_ADMIN,
        { expiresIn: "1d" }); //token expires in 1 day
          
        const cookieOptions = { 
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
            httpOnly: true, // cookie cannot be accessed by client-side scripts via js directly
            secure: process.env.NODE_ENV === "production", // cookie is only sent over HTTPS in production
            sameSite: "strict" // cookie is only sent for same-site requests and prevents CSRF attacks
        };

        res.cookie("token", token, cookieOptions);

        res.status(201).json({
            message: "Admin logged in successfully",
            admin,
            token
        });

   } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Error in logging in"
        });
   }
}


async function logoutAdmin(req, res) {
    try {
        if(!req.cookies.token){
            return res.status(401).json({
                errors: "Kindly login first to logout"
            })
        }
        res.clearCookie("token");   
        res.status(200).json({
            message: "Admin logged out successfully"
        
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Error in logging out"
        });
    }
}

module.exports = {  
    signUpAdmin,
    loginAdmin,
    logoutAdmin
};