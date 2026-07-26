const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
    }

})

const purchaseModel = mongoose.model("Purchase", purchaseSchema);

module.exports = purchaseModel;