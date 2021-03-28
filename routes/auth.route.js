const express = require("express");
const router = express.Router();



//middleware - validation 
const {registerFormValidation,activateAccountWithPasswordFormValidation,loginFormValidation,passwordForgetValidator,passwordResetValidator,updatePasswordValidator} = require("../middlewares/FormValidation");

//controllers
const {
    registerController,
    activateAccountController,
    activateAccountWithPasswordController,
    loginController,
    passwordForgetController,
    passwordResetController,
    passwordResetWithPasswordController,
    googleController,
    facebookController,
    refreshTokenController,
    logoutController,
    userController,
    updatePasswordController

} = require("../controllers/auth.controllers");

//Routes
router.post("/register", registerFormValidation,registerController);

router.post("/activateAccount",activateAccountController);

router.post("/activateAccountWithPassword",activateAccountWithPasswordFormValidation,activateAccountWithPasswordController);

router.post("/login",loginFormValidation,loginController);

router.put("/password/forget",passwordForgetValidator,passwordForgetController);

router.post("/password/reset",passwordResetController);

router.put("/password/resetWithPassword",passwordResetValidator,passwordResetWithPasswordController);

router.post("/googleLogin", googleController);

router.post("/facebooklogin", facebookController);

//save refresh token to db of the user and keep updating if not save to a entire new table and reference user id as a reference key
router.post("/refreshToken", refreshTokenController);

router.delete("/logout", logoutController);

router.get("/user", userController);



module.exports=router;

