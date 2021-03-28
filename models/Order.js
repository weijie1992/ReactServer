const mongoose = require("mongoose");
const {ObjectId} = mongoose.Schema;

const OrderSchema = new mongoose.Schema(
    {
        products :[
            {
                product : {
                    type: ObjectId,
                    ref: "Product"
                },
                purchaseQuantity:Number,
            }
        ],
        paymentIntent : {},
        orderStatus : {
            type:String,
            default: "To Pay",
            enum:["To Pay","To Ship","To Receive","Completed", "Cancelled"]
        },
        orderedBy:{
            type:ObjectId,
            ref:"user"
        },
    },
    {timestamps:true}
);

module.exports = mongoose.model("Order",OrderSchema);