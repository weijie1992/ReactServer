const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        text: true
    },
    description: {
        type: String,
        required: true,
        text: true
    },
    slug: {
        type: String,
        unique: true,
        index: true //for searching the DB
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    availableQuantity: Number,
    sold: {
        type: Number,
        default: 0
    },
    images: {
        type: Array
    },
    // images: [
    //     {

    //     }
    // ],
    ratings: [ //may not be implemented
        {
            star: Number,
            postedBy: {
                type: ObjectId,
                ref:"User"
            }
        }
    ],
    color: { //option let user to add
        required: false,
        type: Array
    },
    category: {
        type: ObjectId,
        ref: "Category"
    },
    subCategories: [
        {
            type: ObjectId,
            ref: "SubCategory"
        }
    ],
    // brand: { //may need a table for selection
    //     required: false,
    //     type: ObjectId,
    //     ref: "Brand"
    // },
    shippingProvider: [
        {  //may need a table for selection, 1 to many
            type: ObjectId,
            ref: "ShippingProvider"
        }]
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);