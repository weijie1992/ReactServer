const mongoose = require("mongoose");

const shippingProvider = new mongoose.Schema ({
    name:{
        type: String,
        required: true
    },
    price : {
        type:Number,
        required:true,
    }
});

module.exports = mongoose.model("ShippingProvider", shippingProvider);