const mongoose = require("mongoose");
const {ObjectId} = mongoose.Schema;

const SubCategorySchema = new mongoose.Schema(
    {
        name: {
            type:String,
            trim:true,
            required:true
        },
        slug: {
            type:String,
            unique:true,
            lowercase:true,
            index:true
        },
        parentCategory: {
            type:ObjectId,
            ref:"Category",
            required:true
        }
    },
    {timestamps:true}
)

module.exports = mongoose.model("SubCategory",SubCategorySchema);