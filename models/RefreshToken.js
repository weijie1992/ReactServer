const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

//refreshToken Schema
const refreshTokenSchema = new mongoose.Schema({
    userID: {
        type:ObjectId,
        ref:"user"
    },
    rToken : String
});

module.exports = mongoose.model("RefreshToken",refreshTokenSchema);