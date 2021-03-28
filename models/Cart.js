const mongoose = require("mongoose");
const {ObjectId} = mongoose.Schema;

const CartSchema = new mongoose.Schema({
    products : [
        {
            product: {
                type:ObjectId,
                ref:"Product"
            },
            purchaseQuantity:Number,
            totalPriceWithQuantity:Number
        }
    ],
    totalPriceBeforeDiscount:Number,
    totalPriceAfterDiscount:Number,
    userID:{
        type:ObjectId,
        ref:"user"
    },
},{timestamps:true})

module.exports=mongoose.model("Cart", CartSchema);