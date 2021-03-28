const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    name: {
        type:String,
        trim:true,
        required:true,
    },
    slug: {
        type:String,
        unique:true,
        lowercase:true,
        index:true //for Better execution of query, without this mongoose will have to perform collection scan which is scan every document
    }
},{timestamps:true});

module.exports = mongoose.model("Category",CategorySchema)