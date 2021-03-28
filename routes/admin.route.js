const express = require("express");
const router = express.Router();

//middleware - auth check
const {userAuthCheck,adminAuthCheck} = require("../middlewares/userAuthCheck");
//controllers
const {
    adminDashboardController
} = require("../controllers/admin.controller");


router.get("/admin/dashboard",userAuthCheck,adminAuthCheck, adminDashboardController);

module.exports=router;