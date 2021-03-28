const { validationResult } = require("express-validator");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const sgMail = require("@sendgrid/mail");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
sgMail.setApiKey(process.env.SENDGRID_APIKEY);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const generator = require("generate-password");

const generateSignInToken = (_id, email) => {
    return jwt.sign(
        {
            _id, email
        },
        process.env.JWT_SIGNIN,
        {
            expiresIn: "100m"
        }
    );
}

const generateRefreshSignInToken = (_id, email) => {
    return jwt.sign(
        {
            _id, email
        },
        process.env.JWT_SIGNIN_REFRESH
    );
}

exports.registerController = (req, res) => {

    // const{name,email,password} = req.body;
    const { email } = req.body;
    //Form validations
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map((error) => {
            return error.msg;
        });
        return res.status(422).json({
            error: firstError
        })
    } else { //No validation errors
        //check if user exist 
        User.findOne({ email }, (err, user) => {
            if (user) {
                return res.status(400).json({
                    error: `${email} has an account with us, click on forget password to retrieve your account`
                });
            } else { //User does not exist, sent email
                //generate token, encrypt name, password and email, expires in 15mins
                const token = jwt.sign(
                    {
                        // email
                        email
                    },
                    process.env.JWT_ACTIVATEACCOUNT,
                    {
                        expiresIn: "15m"
                    }
                );
                //send email using sendgrid
                const emailData = {
                    from: process.env.EMAIL_FROM,
                    to: email,
                    Subject: "MumsCooky Account Activation",
                    html: `
                        <h1>Click the URL below to activate your MumsCooky Account</h1>
                        <p>This activate URL only last for 15mins</p>
                        <p>${process.env.CLIENT_URL}/user/activate/${token}</p>
                    `
                };
                sgMail.send(emailData)
                    .then(() => {
                        return res.json({
                            message: `Email has been sent to ${email}`
                        })
                    }, error => {
                        console.error("registerController^SendGrid.send:", error.response.body);
                        return res.status(500).json({
                            error: "Error encounter when sending registration email. Please try to register again."
                        })
                    })

            }// end else user not found send email
        })// end user findOne
    }
};

exports.activateAccountController = (req, res) => {
    const { token } = req.body;
    //verify if token is valid
    if (token) {
        jwt.verify(token, process.env.JWT_ACTIVATEACCOUNT,
            async (err, decoded) => {
                if (err) {
                    console.error("activateAccountController^JWT_Decode_Error:", err);
                    res.status(401).json({
                        error: "Account activation URL expired. Please sign up again"
                    })
                } else { //if valid add to user db
                    console.log("decoded", decoded);
                    //get name, email password
                    const { email } = decoded;
                    return res.sendStatus(204);
                }
            }
        );
    } else { //Token not pass
        console.error("activateAccountController : No Token passed by Client");
        return res.status(400).json({
            error: "Fail to activate your account. Please sign up again"
        })
    }
};

exports.activateAccountWithPasswordController = async (req, res) => {
    const { name, token, password } = req.body;
    const regexForEmail = /^[a-zA-Z0-9]+@(?:[a-zA-Z0-9]+\.)+[A-Za-z]+$/;
    if (name, token, password) {
        jwt.verify(token, process.env.JWT_ACTIVATEACCOUNT,
            async (err, decoded) => {
                if (err) {
                    console.error("activateAccountWithPasswordController^JWT_Decode_Error:", err);
                    res.status(401).json({
                        error: "Account activation URL expired. Please sign up again"
                    })
                } else { //if valid add to user db
                    const { email } = decoded;
                    //Custm Validations for email
                    if (!regexForEmail.test(email)) {
                        console.error("activateAccountWithPasswordController:Custom_Validations_For_Email:");
                        return res.status(422).json({
                            error: "Account activation URL expired. Please sign up again"
                        });
                    }
                    //Form validations
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        console.error("activateAccountWithPasswordController^Form_validations:", errors);
                        // const firstError = errors.array().map((error) => {
                        //     return error.msg;
                        // });
                        return res.status(422).json({
                            error: "Account activation URL expired. Please sign up again"
                        });
                    } else {
                        //bcrypt password
                        try {
                            const salt = await bcrypt.genSalt();
                            const hashed_password = await bcrypt.hash(password, salt);
                            const user = new User({
                                name, email, hashed_password
                            });
                            user.save((err, user) => {
                                if (err) {
                                    console.error("activateAccountWithPasswordController^Mongoose_Save_errror:", err);
                                    return res.status(401).json({
                                        error: "Fail to activate your account. Please sign up again"
                                    })
                                } else {
                                    //generate token to sign user in
                                    const signInToken = generateSignInToken(user._id, user.email);
                                    const signInRefreshToken = generateRefreshSignInToken(user._id, user.email);

                                    //Add refresh token to DB
                                    const refreshToken = new RefreshToken({
                                        userID: user._id,
                                        rToken: signInRefreshToken
                                    });
                                    refreshToken.save((err, refreshToken) => {
                                        if (err) {
                                            console.error("activateAccountWithPasswordController^RefreshToken.save:", err);
                                            return res.json({
                                                email: user.email,
                                                name: user.name,
                                                role: user.role,
                                                address: user.address,
                                                wishlist: user.wishlist,
                                                token: signInToken,
                                                rfToken: signInRefreshToken
                                            });
                                        } else {
                                            return res.json({
                                                email: user.email,
                                                name: user.name,
                                                role: user.role,
                                                address: user.address,
                                                wishlist: user.wishlist,
                                                token: signInToken,
                                                rfToken: signInRefreshToken
                                            });
                                        }
                                    })//end RefreshToken.save
                                } //end else 
                            }); //end user.save
                        } catch (err) {
                            console.error("activateAccountWithPasswordController^Bcrypt Err:", err);
                            return res.status(500).json({
                                error: "Fail to activate your account. Please sign up again"
                            })
                        } //End try catch for Bcrypt
                    } //end else - form validation no errors
                }//End else JWT successfully verified
            } //end JWT jwt.verify function
        );//end JWT jwt.verify function
    } else { //No name/token/password not pass
        console.error("activateAccountWithPasswordController : No name/token/password passed by Client");
        return res.status(400).json({
            error: "Fail to activate your account. Please sign up again"
        })
    }

}

exports.loginController = (req, res) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map(error => error.msg);
        return res.status(422).json({
            error: firstError
        });
    } else {
        // User.findOne({email}).exec(async (err,user) => {
        User.findOne({ email }, async (err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    error: "You do not have an account with us."
                });
            } else {
                try {
                    console.log(password);
                    console.log(user.hashed_password);
                    if (await bcrypt.compare(password, user.hashed_password)) {
                        //generate token
                        const signInToken = generateSignInToken(user._id, user.email);
                        const signInRefreshToken = generateRefreshSignInToken(user._id, user.email);

                        //Update refresh token
                        RefreshToken.findOneAndUpdate(
                            {
                                userID: user._id
                            },
                            {
                                rToken: signInRefreshToken
                            },
                            {
                                new: true,
                                upsert: true
                            }
                            , (err, RefreshToken) => {
                                if (err) {
                                    //Unable to find refresh token in database
                                    console.error("loginController^RefreshToken_findOneAndUpdate:", err);
                                    return res.status(500).json({
                                        error: "Server error please try to login again"
                                    });
                                } else if (!RefreshToken) {
                                    //Refresh Token something wrong
                                    console.error("loginController^RefreshToken_findOneAndUpdate: refreshToken something wrong");
                                    return res.json({
                                        email: user.email,
                                        name: user.name,
                                        role: user.role,
                                        address: user.address,
                                        wishlist: user.wishlist,
                                        token: signInToken,
                                        rfToken: signInRefreshToken
                                    });
                                } else { //Refresh token found 
                                    return res.json({
                                        email: user.email,
                                        name: user.name,
                                        role: user.role,
                                        address: user.address,
                                        wishlist: user.wishlist,
                                        token: signInToken,
                                        rfToken: signInRefreshToken
                                    });
                                } //End else -Refresh token found
                            });//End refresh token.findOneAndUpdate  


                    } else {
                        return res.status(400).json({
                            error: "Email and password don't match"
                        });
                    }
                }
                catch (err) {
                    console.error("loginController^BycryptCompare :", err);
                    return res.status(500).json({
                        error: "Server Error, please try again later"
                    });
                }
            } //end else - user found
        });//end findOne
    }//end else no error
};

exports.passwordForgetController = (req, res) => {
    const { email } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array().map(error => error.msg);
        return res.status(422).json({
            error: firstError
        });
    } else {
        //Check if user exist
        User.findOne({ email }, (err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    error: "User with this email does not exist"
                })
            } else {
                //Generate JWT token
                const token = jwt.sign(
                    {
                        _id: user._id
                    },
                    process.env.JWT_FORGETPASSWORD,
                    {
                        expiresIn: "15m"
                    }
                );

                //send email with this token using sendgrid
                const emailData = {
                    from: process.env.EMAIL_FROM,
                    to: email,
                    Subject: "MumsCooky Password Reset",
                    html: `
                        <h1>Click the URL below to reset your MumsCooky Account</h1>
                        <p>This reset password URL only last for 15mins</p>
                        <p>${process.env.CLIENT_URL}/user/password/reset/${token}</p>
                    `
                };
                sgMail.send(emailData)
                    .then(() => {
                        return res.json({
                            message: `Email has been sent to ${email}`
                        })
                    }, error => {
                        console.error("passwordForgetController^SendGrid.send:", error.response.body);
                        return res.status(400).json({
                            error: "Error encounter when sending password reset email. Please try to reset your password again."
                        });
                    }); //End Sgmail.send
            }//end else user found
        });//end user.findOne
    }
};

exports.passwordResetController = (req, res) => {
    const { token } = req.body;
    //verify if token is valid
    if (token) {
        jwt.verify(token, process.env.JWT_FORGETPASSWORD,
            async (err, decoded) => {
                if (err) {
                    console.error("passwordResetController^JWT_Decode_Error:", err);
                    res.status(401).json({
                        error: "Password reset URL expired. Please click on forget password again"
                    })
                } else { //if valid add to user db
                    console.log("decoded", decoded);
                    return res.sendStatus(204);
                }
            }
        );
    } else { //Token not pass
        console.error("passwordResetController : No Token passed by Client");
        return res.status(400).json({
            error: "Fail to reset your account. Please click on forget password again"
        })
    }
};

exports.passwordResetWithPasswordController = (req, res) => {
    const { token, newPassword } = req.body;
    console.log(newPassword);
    if (token) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstError = errors.array().map(error => error.msg);
            return res.status(422).json({
                error: firstError
            });
        } else {
            //Verify JWT token
            jwt.verify(token,
                process.env.JWT_FORGETPASSWORD,
                async (err, decoded) => {
                    if (err) {
                        console.error("passwordResetController^JWT_Decode_Error:", err);
                        return res.status(400).json({
                            error: "Reset URL expired. Please try again"
                        })
                    } else {
                        const { _id } = decoded;
                        try {
                            const salt = await bcrypt.genSalt();
                            const hashed_password = await bcrypt.hash(newPassword, salt);

                            User.findByIdAndUpdate(_id, { hashed_password: hashed_password }, { new: true }, (err, user) => {
                                if (err || !user) {
                                    console.error("passwordResetController^findById", err);
                                    return res.status(500).json({
                                        error: "Fail to reset your account. Please try again"
                                    })
                                } else { //update successful
                                    //generate token
                                    const signInToken = generateSignInToken(user._id, user.email);
                                    const signInRefreshToken = generateRefreshSignInToken(user._id, user.email);

                                    //Update refresh token
                                    RefreshToken.findOneAndUpdate(
                                        {
                                            userID: user._id
                                        },
                                        {
                                            rToken: signInRefreshToken
                                        },
                                        {
                                            new: true,
                                            upsert: true
                                        }
                                        , (err, RefreshToken) => {
                                            if (err) {
                                                //Unable to find refresh token in database
                                                console.error("passwordResetController^RefreshToken_findOneAndUpdate:", err);
                                                return res.json({
                                                    email: user.email,
                                                    name: user.name,
                                                    role: user.role,
                                                    address: user.address,
                                                    wishlist: user.wishlist,
                                                    token: signInToken,
                                                    rfToken: signInRefreshToken
                                                });
                                            } else if (!RefreshToken) {
                                                //Unable to find refresh token in database
                                                console.error("passwordResetController^RefreshToken_findOneAndUpdate: refresh token not found");
                                                return res.json({
                                                    email: user.email,
                                                    name: user.name,
                                                    role: user.role,
                                                    address: user.address,
                                                    wishlist: user.wishlist,
                                                    token: signInToken,
                                                    rfToken: signInRefreshToken
                                                });
                                            } else { //Refresh token found 
                                                return res.json({
                                                    email: user.email,
                                                    name: user.name,
                                                    role: user.role,
                                                    address: user.address,
                                                    wishlist: user.wishlist,
                                                    token: signInToken,
                                                    rfToken: signInRefreshToken
                                                });
                                            } //End else -Refresh token found
                                        });//End refresh token.findOneAndUpdate  
                                } //end user found and update successful
                            });//end User.findByIdAndUpdate
                        } catch (err) {
                            console.error("passwordResetController^Bcrypt Err:", err);
                            res.status(500).json({
                                error: "Fail to reset your account. Please try again"
                            })
                        } //end catch
                    } //end JWT verify
                })
        }
    } else { //Token not pass
        console.error("passwordResetController : No Token passed by Client");
        res.status(400).json({
            error: "Fail to reset your password. Please try again"
        })
    }

};

exports.refreshTokenController = (req, res) => {
    const { refreshToken } = req.body;
    //Check if refresh token exist in database
    if (refreshToken) {
        //verify refresh token
        jwt.verify(refreshToken,
            process.env.JWT_SIGNIN_REFRESH,
            (err, decoded) => {
                if (err) {
                    //Unable to decode
                    console.error("refreshTokenController^JWT_Decode_Error:", err);
                    return res.status(400).json({
                        error: "Session timeout please relogin"
                    });
                } else {
                    //Check if refresh token of the user is in database
                    const { _id, email } = decoded;
                    //Generate token
                    const signInToken = generateSignInToken(_id, email);
                    const signInRefreshToken = generateRefreshSignInToken(_id, email);

                    RefreshToken.findOneAndUpdate(
                        {
                            userID: _id,
                            rToken: refreshToken
                        },
                        {
                            rToken: signInRefreshToken
                        },
                        {
                            new: true
                        }
                        , (err, RefreshToken) => {
                            if (err || !RefreshToken) {
                                //Unable to find refresh token in database
                                console.error("refreshTokenController^RefreshToken_findOneAndUpdate:", err);
                                return res.status(400).json({
                                    error: "Session timeout please relogin"
                                });
                            } else { //Refresh token found 
                                //Retrieve user info
                                User.findOne({ email }, "email name role", (err, user) => {
                                    if (err || !user) {
                                        console.error("refreshTokenController^RefreshToken_User.findOne:", err);
                                        return res.status(400).json({
                                            error: "Session timeout please relogin"
                                        });
                                    } else {
                                        return res.json({
                                            email: user.email,
                                            name: user.name,
                                            role: user.role,
                                            address: user.address,
                                            wishlist: user.wishlist,
                                            token: signInToken,
                                            rfToken: signInRefreshToken
                                        });
                                    }
                                })//End User.findone
                            } //End else -Refresh token found
                        });//End refresh token.findOneAndUpdate
                }//End else - JWT decoded successfully
            })//End JWT verifiy
    } else {
        console.error("refreshTokenController : No Token passed by Client");
        res.status(400).json({
            error: "Session timeout please relogin"
        })
    }
};

exports.logoutController = (req, res) => {
    const { rToken } = req.body;
    if (rToken) {
        RefreshToken.findOneAndRemove(
            { rToken },
            (err, RefreshToken) => {
                if (err) {
                    console.error("logoutController^RefreshToken.findOneAndDelete:", err);
                } else if (!RefreshToken) {
                    console.error("logoutController^RefreshToken.findOneAndDelete: cant find RefreshToken");
                }
                res.sendStatus(204);
            }
        );
    }
}

exports.userController = (req, res) => {
    // const token = req.header('authToken');
    // const rfToken = req.header("rfAuthToken");

    const token = req.header("Authorization").split("Bearer ")[1];
    console.log(token);
    console.log("UserControllerrrrrrrr", token);
    if (!token) {
        console.error("userController^Token not pass by Client");
        return res.status(401).json({
            error: "No Token"
        })
    }
    //verify token
    jwt.verify(token,
        process.env.JWT_SIGNIN,
        (err, decoded) => {
            if (err) {
                console.error("userController^verify", err);
                return res.status(401).json({
                    error: "Token expired"
                });
            } else {
                const { _id } = decoded;
                User.findById(_id, "email name role", (err, user) => {
                    if (err || !user) {
                        console.error("userController^findById", err);
                        return res.status(400).json({
                            error: "User not found"
                        });
                    } else {
                        return res.json({
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            address: user.address,
                            wishlist: user.wishlist,
                            token
                        });
                    }
                });//End User.findById
            }//end else - JWT no error
        }//end JWT verify
    )//end JWT verify
}

exports.googleController = async (req, res) => {
    //Get Token from Request
    const { idToken } = req.body;
    if (idToken) {
        //verify token
        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        console.log("TICKET IS : ", ticket);
        const payload = ticket.getPayload();
        console.log("payload IS : ", payload);
        const { email_verified, name, email } = payload;

        if (email_verified) {
            User.findOne({ email }, async (err, user) => {
                if (err) {
                    console.error("googleController^User.findone error :", err);
                    return res.status(500).json({
                        error: "Server error please try to login again"
                    });
                }
                //If user exist 
                if (user) {
                    console.log("In User exist");
                    //generate token
                    const signInToken = generateSignInToken(user._id, user.email);
                    const signInRefreshToken = generateRefreshSignInToken(user._id, user.email);

                    //Update refresh token
                    RefreshToken.findOneAndUpdate(
                        {
                            userID: user._id
                        },
                        {
                            rToken: signInRefreshToken
                        },
                        {
                            new: true,
                            upsert: true
                        }
                        , (err, RefreshToken) => {
                            if (err) {
                                //Unable to find refresh token in database
                                console.error("googleController^RefreshToken_findOneAndUpdate:", err);
                                return res.status(500).json({
                                    error: "Server error please try to login again"
                                });
                            } else if (!RefreshToken) {
                                //Refresh Token something wrong
                                console.error("googleController^RefreshToken_findOneAndUpdate: refreshToken something wrong");
                                return res.json({
                                    email: user.email,
                                    name: user.name,
                                    role: user.role,
                                    address: user.address,
                                    wishlist: user.wishlist,
                                    token: signInToken,
                                    rfToken: signInRefreshToken
                                });
                            } else { //Refresh token found 
                                return res.json({
                                    email: user.email,
                                    name: user.name,
                                    role: user.role,
                                    address: user.address,
                                    wishlist: user.wishlist,
                                    token: signInToken,
                                    rfToken: signInRefreshToken
                                });
                            } //End else -Refresh token found
                        });//End refresh token.findOneAndUpdate  
                } else { //user don exist insert to DB
                    //generate a random password
                    try {
                        const salt = await bcrypt.genSalt();
                        const generateRandomPW = generator.generate({
                            length: 10,
                            strict: true
                        });
                        console.log("generateRandomPW : ", generateRandomPW)
                        const hashed_password = await bcrypt.hash(generateRandomPW, salt);
                        //add user to db
                        const user = new User({
                            email,
                            name,
                            hashed_password
                        });
                        user.save((err, user) => {
                            console.log("In User NOT exist");
                            if (err) {
                                console.error("googleController^Mongoose_Save_errror:", err);
                                return res.status(500).json({
                                    error: "Server error please try again later"
                                });
                            } else {
                                //generate token
                                const signInToken = generateSignInToken(user._id, user.email);
                                const signInRefreshToken = generateRefreshSignInToken(user._id, user.email);
                                //Add refresh token to DB
                                const refreshToken = new RefreshToken({
                                    userID: user._id,
                                    rToken: signInRefreshToken
                                });
                                refreshToken.save((err, refreshToken) => {
                                    if (err) {
                                        console.error("googleController^RefreshToken.save:", err);
                                        return res.json({
                                            email: user.email,
                                            name: user.name,
                                            role: user.role,
                                            address: user.address,
                                            wishlist: user.wishlist,
                                            token: signInToken,
                                            rfToken: signInRefreshToken
                                        });
                                    } else {
                                        return res.json({
                                            email: user.email,
                                            name: user.name,
                                            role: user.role,
                                            address: user.address,
                                            wishlist: user.wishlist,
                                            token: signInToken,
                                            rfToken: signInRefreshToken
                                        });
                                    }
                                });//end refreshToken.save 
                            }//else  - user.save no error
                        })//end user.save  

                    } catch (err) {
                        console.error("googleController^bcrypt error :", err);
                        return res.status(500).json({
                            error: "Server error please try again later"
                        });
                    }
                }
            })
        } else { //email not verified
            console.error("googleController^Email not verified");
            return res.status(401).json({
                error: "Your Gmail account is not verified"
            });
        }
    } else { //email not verified
        console.error("googleController^IdToken not sent from client");
        return res.status(401).json({
            error: "Server error please try again later"
        });
    }
}

exports.facebookController = async (req, res) => {
    //Get Token from Request
    const { userID, accessToken } = req.body;
    if (userID, accessToken) {
        const url = `https://graph.facebook.com/${userID}?fields=id,name,email&access_token=${accessToken}`;
        try {
            const response = await fetch(url, { method: "GET" });
            const jsonResponse = await response.json();
            const { name, email } = jsonResponse;
            User.findOne({ email }, async (err, user) => {
                //if error
                if (err) {
                    console.error("facebookController^User.findone error :", err);
                    return res.status(500).json({
                        error: "Server error please try to login again"
                    });
                }
                //If user exist 
                if (user) {
                    console.log("In User exist");
                    //generate token
                    const signInToken = generateSignInToken(user._id, user.email);
                    const signInRefreshToken = generateRefreshSignInToken(user._id, user.email);
                    //Update refresh token
                    RefreshToken.findOneAndUpdate(
                        {
                            userID: user._id
                        },
                        {
                            rToken: signInRefreshToken
                        },
                        {
                            new: true,
                            upsert: true
                        }
                        , (err, RefreshToken) => {
                            if (err) {
                                //Unable to find refresh token in database
                                console.error("facebookController^RefreshToken_findOneAndUpdate:", err);
                                return res.status(500).json({
                                    error: "Server error please try to login again"
                                });
                            } else if (!RefreshToken) {
                                //Refresh Token something wrong
                                console.error("facebookController^RefreshToken_findOneAndUpdate: refreshToken something wrong");
                                return res.json({
                                    email: user.email,
                                    name: user.name,
                                    role: user.role,
                                    address: user.address,
                                    wishlist: user.wishlist,
                                    token: signInToken,
                                    rfToken: signInRefreshToken
                                });
                            } else { //Refresh token found 
                                return res.json({
                                    email: user.email,
                                    name: user.name,
                                    role: user.role,
                                    address: user.address,
                                    wishlist: user.wishlist,
                                    token: signInToken,
                                    rfToken: signInRefreshToken
                                });
                            } //End else -Refresh token found
                        });//End refresh token.findOneAndUpdate  
                } else { //user don exist insert to DB
                    //generate a random password
                    try {
                        const salt = await bcrypt.genSalt();
                        const generateRandomPW = generator.generate({
                            length: 10,
                            strict: true
                        });
                        console.log("generateRandomPW : ", generateRandomPW)
                        const hashed_password = await bcrypt.hash(generateRandomPW, salt);
                        //add user to db
                        const user = new User({
                            email,
                            name,
                            hashed_password
                        });
                        user.save((err, user) => {
                            console.log("In User NOT exist");
                            if (err) {
                                console.error("googleController^Mongoose_Save_errror:", err);
                                return res.status(500).json({
                                    error: "Server error please try again later"
                                });
                            } else {
                                //generate token
                                const signInToken = generateSignInToken(user._id, user.email);
                                const signInRefreshToken = generateRefreshSignInToken(user._id, user.email);
                                //Add refresh token to DB
                                const refreshToken = new RefreshToken({
                                    userID: user._id,
                                    rToken: signInRefreshToken
                                });
                                refreshToken.save((err, refreshToken) => {
                                    if (err) {
                                        console.error("facebookController^RefreshToken.save:", err);
                                        return res.json({
                                            email: user.email,
                                            name: user.name,
                                            role: user.role,
                                            address: user.address,
                                            wishlist: user.wishlist,
                                            token: signInToken,
                                            rfToken: signInRefreshToken
                                        });
                                    } else {
                                        return res.json({
                                            email: user.email,
                                            name: user.name,
                                            role: user.role,
                                            address: user.address,
                                            wishlist: user.wishlist,
                                            token: signInToken,
                                            rfToken: signInRefreshToken
                                        });
                                    }
                                });//end refreshToken.save 
                            }//else  - user.save no error
                        })//end user.save  

                    } catch (err) {
                        console.error("facebookController^bcrypt error :", err);
                        return res.status(500).json({
                            error: "Server error please try again later"
                        });
                    }
                } //end else - user dont exist in db
            })// end User.findOne
        } catch (err) {
            console.error("facebookController^facebook fetch error: ", err);
            return res.status(500).json({
                error: "Server error please try again later"
            });
        }
    } else {
        console.error("facebookController^userID or accessToken not sent from client");
        return res.status(401).json({
            error: "Server error please try again later"
        });
    }
}

