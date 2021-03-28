const express = require("express");
const router = express.Router();

//middleware - auth check
const {userAuthCheck,adminAuthCheck} = require("../middlewares/userAuthCheck");

//controller 
const {createCategoryController, listCategoryController,getCategoryController, updateCategoryController , deleteCategoryController} = require("../controllers/category.controller");

router.post("/category",userAuthCheck,adminAuthCheck,createCategoryController);

router.get("/categories",listCategoryController);

router.get("/category/:slug", getCategoryController);

router.delete("/category/:slug",userAuthCheck,adminAuthCheck,deleteCategoryController);

router.put("/category/:slug",userAuthCheck,adminAuthCheck,updateCategoryController);

module.exports=router;