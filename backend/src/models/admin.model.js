const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require("mongoose");


const adminSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
    },
    lastName:{      
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    }
})


const adminModel = mongoose.model("Admin", adminSchema);

module.exports = adminModel;