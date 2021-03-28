const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.userAuthCheck = (req, res, next) => {
    // const{token} = req.body;
    if (req.header("Authorization")) {
        const token = req.header("Authorization").split("Bearer ")[1];
        console.log(token);
        jwt.verify(token, process.env.JWT_SIGNIN,
            (err, decoded) => {
                if (err) {
                    if (err.message === "jwt expired") {
                        return res.status(401).json({
                            error: "J01"
                        });
                    } else {
                        console.error("userAuthCheck^JWT_Decode_Error:", err);
                        return res.status(401).json({
                            error: "Session timeout please relogin"
                        });
                    }
                } else { //if valid add to user db
                    // return res.send("success");

                    const { _id, email } = decoded;
                    req.user = {};
                    req.user._id = _id;
                    req.user.email = email;
                    next();
                }
            }//End JWT Verify
        );//End JWT Verify     
    } else { //if token not pass
        console.error("userAuthCheck^No token pass");
        res.status(401).json({
            error: "Session timeout please relogin"
        });
    }
};

exports.adminAuthCheck = async (req, res, next) => {
    if (req.user && req.user._id) {
        User.findById(req.user._id, (err, user) => {
            if (err || !user) {
                console.error("adminAuthCheck^user findOne err||!user :", err);
                res.status(401).json({
                    error: "Session timeout please relogin"
                });
            } else {
                if (user.role !== "admin") {
                    console.error("adminAuthCheck^ user role not admin");
                    res.status(401).json({
                        error: "Session timeout please relogin"
                    });
                } else {
                    // req.user._id = _id;
                    // req.user.email = email;
                    next();
                }
            }//end else - user found
        }) //end User.findone 
    } else {
        console.error("adminAuthCheck^req.user or req.user_id Not assigned");
        res.status(401).json({
            error: "Session timeout please relogin"
        });
    }

}
