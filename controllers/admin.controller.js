const User = require("../models/User");

exports.adminDashboardController = (req,res) => {
    res.json({"message":"Admin Route"});
}