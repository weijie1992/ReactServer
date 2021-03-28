const mongoose = require("mongoose");
const {ObjectId} = mongoose.Schema;
//User Schema
const userSchema = new mongoose.Schema({
    email: {
        type:String,
        trim:true,
        require:true,
        unique:true,
        lowercase:true
    },
    name : {
        type:String,
        trim: true,
        require:true
    },
    hashed_password: {
        type:String,
        require:true
    },
    role: {
        type:String,
        default:"normal"
    },
    address: [
        {
            buildingOrStreet:String,
            unitNo:String,
            postalCode:Number
        }
    ],
    wishlist:[
        {
            type:ObjectId,
            ref:"Product"
        }
    ]
}, {timestamps:true});

module.exports = mongoose.model("User",userSchema);