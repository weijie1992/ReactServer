const express = require("express");
const router = express.Router();

//middleware - auth check
const {userAuthCheck,adminAuthCheck} = require("../middlewares/userAuthCheck");

//controller 
const {createSubCategoryController, listSubCategoryController,getSubCategoryController, updateSubCategoryController , deleteSubCategoryController,listSubCategoriesByCategoryController} = require("../controllers/subCategory.controller");

router.post("/subcategory",userAuthCheck,adminAuthCheck,createSubCategoryController);

router.get("/subcategories",listSubCategoryController);

// router.get("/subcategory/:slug", getSubCategoryController);

router.delete("/subcategory/:slug",userAuthCheck,adminAuthCheck,deleteSubCategoryController);

router.put("/subcategory/:slug",userAuthCheck,adminAuthCheck,updateSubCategoryController);

router.get("/category/subcategory/:categoryID",listSubCategoriesByCategoryController);

module.exports=router;