const { validationResult } = require("express-validator");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const sgMail = require("@sendgrid/mail");
const bcrypt = require("bcrypt");
sgMail.setApiKey(process.env.SENDGRID_APIKEY);

exports.updatePasswordController = async (req, res) => {
    
    const { currentPassword, updatedPassword } = req.body;
    
    if (currentPassword && updatedPassword) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstError = errors.array().map(error => error.msg);
            return res.status(422).json({
                error: firstError
            });
        } else {
            console.log("****1");
            User.findById(req.user._id, async (err, user) => {
                if (err || !user) {
                    console.error("updatePasswordController^findById_error or no user:", err);
                    return res.status(401).json({
                        error: "Fail to update your account. Please sign up again"
                    })
                }
                else {
                    console.log("****2");
                    //Decrypt password
                    try {
                        console.log("****3");
                        if (await bcrypt.compare(currentPassword, user.hashed_password)) {
                            console.log("****5");
                            //hash new password
                            const salt = await bcrypt.genSalt();
                            const updated_hashed_password = await bcrypt.hash(updatedPassword, salt);
                            user.hashed_password = updated_hashed_password;
                            user.save((err, updatedUser) => {
                                if (err) {
                                    console.error("updatePasswordController^bcrypt.compare:", err);
                                    return res.status(500).json({
                                        error: "Fail to update your password please try again"
                                    });
                                } else {
                                    console.log("****4");
                                    return res.json({
                                        message:"Password Updated Successfully"
                                    })
                                }
                            });
                        }// end await brypt
                        else {
                            console.log("****7");
                            console.error("updatePasswordController^bcrypt.compare:", err);
                            return res.status(401).json({
                                error: "Current password is incorrect please logout and click on forget password"
                            })
                        }
                    }//end try
                    catch (err) {
                        console.log("****6");
                        console.error("updatePasswordController^bcrypt.compare:", err);
                        return res.status(401).json({
                            error: "Current password is incorrect please logout and click on forget password"
                        })
                    } //end catch bycryt
                }//end Else User.findById
            });//end User.findById
        }//end else no error
    } else {
        console.error("updatePasswordController^token / currentPassword / password not pass by Client");
        return res.status(401).json({
            error: "Unauthorized"
        });
    }//end token && currentPassword && password
}

exports.userDashboardController = (req,res) => {
    console.log(req.body);
    console.log(req.user._id);
    console.log(req.user.email);
}