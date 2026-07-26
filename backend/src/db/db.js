const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require("mongoose");

async function connectDB() {
    
    try{
        await mongoose.connect(process.env.MONGO_URI)

        console.log("Database connected successfully");
    }
    catch(error){
        console.log("Database connection error:", error);
    }
}


module.exports = connectDB;