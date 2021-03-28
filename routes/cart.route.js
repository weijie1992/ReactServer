const express = require("express");
const router = express.Router();

//middleware - auth check
const { userAuthCheck } = require("../middlewares/userAuthCheck");

//controller
const {
    addCartBeforeLoginController, getUserCartOnLoginController,deleteSingleCartItemController,addToCartController,updateCartQuantityController
} = require("../controllers/cart.controller");

router.post("/user/addCartBeforeLogin", userAuthCheck, addCartBeforeLoginController)

router.get("/user/getUserCartOnLogin", userAuthCheck, getUserCartOnLoginController);

router.delete("/user/cart/:productID", userAuthCheck, deleteSingleCartItemController);

router.post("/user/cart", userAuthCheck,addToCartController);

router.put("/user/cart", userAuthCheck,updateCartQuantityController);

module.exports = router;