const express = require("express");
const router = express.Router();

//middleware - auth check
const { userAuthCheck, adminAuthCheck } = require("../middlewares/userAuthCheck");

//controller 
const { createProductController, listAllProductsController,deleteProductController,getProductController,updateProductController,uploadToTempAWSDirectory,getProductsBySearchFilterController,getProductsCountController,getRelatedProductsController,searchController,getProductQuantityController } = require("../controllers/product.controller");

router.get("/product/:slug",getProductController);

router.post("/product", userAuthCheck, adminAuthCheck, createProductController);

router.get("/products", listAllProductsController);

router.delete("/product/:slug",userAuthCheck, adminAuthCheck,deleteProductController);

router.put("/product/:slug",userAuthCheck, adminAuthCheck,updateProductController);

router.post("/productsSearchFilter",getProductsBySearchFilterController);

router.get("/productsCount",getProductsCountController);
// router.post("/productImage",userAuthCheck,adminAuthCheck,uploadToTempAWSDirectory)

router.get("/getRelatedProducts/:productID/:categoryID",getRelatedProductsController);

// router.get("/getProductBySubcategory/:slug",getProductBySubcategoryController);

router.get("/search",searchController);

router.get("/getProductQuantity/:productID",getProductQuantityController)

module.exports = router;