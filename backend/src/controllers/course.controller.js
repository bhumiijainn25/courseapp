const courseModel = require("../models/course.model");
const purchaseModel = require("../models/purchase.model");
const storageService = require("../service/storage.service");
const razorpay = require("../config/razorpay");

const createCourse = async (req, res) => {  
    const adminId = req.adminId;
    
    const { title, description, price} = req.body;
    
    try{
      if(!title || !description || !price){
        return res.status(400).json({
            errors: "All fields are required"
        })
      }
       console.log("req.files:", req.files);
       console.log("req.files.image:", req.files?.image);

      const { image } = req.files;
      if(!image || Object.keys(image).length === 0){
        return res.status(400).json({
            errors: "no image file uploaded"
        })
      }

      const allowedFormat = ["image/png", "image/jpeg"];

      if(!allowedFormat.includes(image.mimetype)){
         return res.status(400).json({
            errors: "Invalid file format, only jpg and png are allowed."
         })
      }
       
      const cloud_response = await storageService.cloud_response(image);
      console.log("Cloudinary Response:", cloud_response);
      
      const courseData ={
        title,
        description,
        price,
        image: {
            public_id: cloud_response.public_id,
            url: cloud_response.url,
        },
        creatorId: adminId
      }

      console.log(courseData);

        const course = await courseModel.create(courseData);

        res.status(201).json({
            message: "Course created successfully",
            course
        });

    }catch(err){
        console.log(err);

        res.status(500).json({
           message: "Error in creating course"
        })
    }
}
async function updateCourse(req, res) {
    const adminId = req.adminId;
    const { courseId } = req.params;
    const { title, description, price } = req.body;

    try {

        // Find course created by this admin
        const course = await courseModel.findOne({
            _id: courseId,
            creatorId: adminId,
        });

        if (!course) {
            return res.status(404).json({
                errors: "Course created by another admin",
            });
        }

        // Keep the old image by default
        let imageData = course.image;

        // If a new image is uploaded,
        // upload it to Cloudinary
        if (req.files && req.files.image) {

            const cloud_response = await storageService.cloud_response(
                req.files.image
            );

            imageData = {
                public_id: cloud_response.public_id,
                url: cloud_response.url,
            };
        }

        const updatedCourse = await courseModel.findByIdAndUpdate(
            courseId,
            {
                title,
                description,
                price,
                image: imageData,
            },
            {
                new: true,
            }
        );

        res.status(200).json({
            message: "Course updated successfully",
            course: updatedCourse,
        });

    } catch (err) {

        console.log("Error updating course:", err);

        res.status(500).json({
            message: "Error updating course",
        });

    }
}

async function deleteCourse(req,res){
    const adminId= req.adminId;

    const {courseId} = req.params;
    
    try{
       const course = await courseModel.findOneAndDelete({
            _id: courseId,
            creatorId: adminId
        });
        if(!course){
            return res.status(404).json({
                errors: "Can't delete, created by other admin",
            })
        }
       res.status(200).json({
            message: "Course deleted successfully",
            course
        })
    }catch(err){
        console.log("Error in deleting course:", err);
        res.status(500).json({
            message: "Error in deleting course"
        })
    }
}

async function getAllCourses(req,res){
    try{
      const courses = await courseModel.find({})
      res.status(201).json({
        message: "Courses fetched successfully",
        courses
      })
    }catch(err){
        console.log("error to get the courses", err);
        res.status(500).json({
            message: "Error in fetching courses"
        })
    }
}

async function getCourseById(req,res){
    const {courseId} = req.params;
    try{
        const course = await courseModel.findById(courseId);   
        if(!course){
            return res.status(404).json({
                message: "Course not found"
            })
        }   
        res.status(200).json({
            message: "Course fetched successfully",
            course
        }) 
    }
    catch(err){
        console.log("error to get the course", err);
        res.status(500).json({
            message: "Error in fetching course"
        })
    }
}


async function buyCourses(req, res) {
    const { userId } = req;
    const { courseId } = req.params;

    try {

        const course = await courseModel.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        const isPurchaseAlreadyExists = await purchaseModel.findOne({
            userId,
            courseId
        });

        if (isPurchaseAlreadyExists) {
            return res.status(400).json({
                message: "User has already purchased this course"
            });
        }

        // Create Razorpay Order
        const options = {
            amount: course.price * 100, // Convert ₹ to paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            order,
            course
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            message: "Error in creating Razorpay order"
        });
    }
}

const crypto = require("crypto");

async function verifyPayment(req, res) {
    const { userId } = req;

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        courseId,
    } = req.body;

    try {

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }

 const existingPurchase = await purchaseModel.findOne({
    userId,
    courseId,
});

if (existingPurchase) {
    return res.status(400).json({
        success: false,
        message: "Course already purchased",
    });
}

const purchase = new purchaseModel({
    userId,
    courseId,
});

await purchase.save();



        return res.status(200).json({
            success: true,
            message: "Course purchased successfully",
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Error verifying payment",
        });
    }
}
// ===============================
// DEMO PURCHASE (FOR LEARNING)
// ===============================
async function demoPurchase(req, res) {
    const { userId } = req;
    const { courseId } = req.params;

    try {

        const course = await courseModel.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const existingPurchase = await purchaseModel.findOne({
            userId,
            courseId,
        });

        if (existingPurchase) {
            return res.status(400).json({
                success: false,
                message: "Course already purchased",
            });
        }

        await purchaseModel.create({
            userId,
            courseId,
        });

        return res.status(200).json({
            success: true,
            message: "Course purchased successfully (Demo Mode)",
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Demo purchase failed",
        });

    }
}

module.exports = {
    createCourse, updateCourse, deleteCourse, getAllCourses, getCourseById, buyCourses, verifyPayment, demoPurchase
}