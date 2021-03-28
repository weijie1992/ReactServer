const express = require("express");
const router = express.Router();

//middleware - auth check
const {userAuthCheck} = require("../middlewares/userAuthCheck");
const {updatePasswordValidator} = require("../middlewares/FormValidation");

//controller 
const {userDashboardController,updatePasswordController} = require("../controllers/user.controller");

router.post("/userDashboard",userAuthCheck,userDashboardController);

router.put("/user/updatePassword",updatePasswordValidator, userAuthCheck, updatePasswordController);

module.exports = router;