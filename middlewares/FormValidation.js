const {check} = require("express-validator");


exports.registerFormValidation = [
    check("email").isEmail().withMessage("Must be a valid Email")
];

exports.activateAccountWithPasswordFormValidation = [
    check("name","Name is required").notEmpty()
    .isLength({
        min:2,
        max:64
    }).withMessage("name must be between 2 to 64 characters"),
    // check("email").isEmail().withMessage("Must be a valid Email"),//omitted because req does not pass email it pass token instead
    check("password", "Password must be 8 to 64 characters, contain 1 upper, 1 lower and a special character")
    .isLength({min:8,max:64})
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/)
];

exports.loginFormValidation = [
    check("email").isEmail().withMessage("Must be a valid Email"),
    check("password", "Password must be 8 to 64 characters, contain 1 upper, 1 lower, 1 numberic and a special character")
    .isLength({min:8,max:64})
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/)
];

exports.passwordForgetValidator = [
    check("email").isEmail().withMessage("Must be a valid Email")
];

exports.passwordResetValidator= [
    check("newPassword", "Password must be 8 to 64 characters, contain 1 upper, 1 lower and a special character")
    .isLength({min:8,max:64})
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/)
]

exports.updatePasswordValidator = [
    check("currentPassword", "Password must be 8 to 64 characters, contain 1 upper, 1 lower and a special character")
    .isLength({min:8,max:64})
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/),
    check("updatedPassword", "Password must be 8 to 64 characters, contain 1 upper, 1 lower and a special character")
    .isLength({min:8,max:64})
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/)
]