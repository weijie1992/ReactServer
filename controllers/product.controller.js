const Product = require("../models/Product");
const SubCategory = require("../models/SubCategory");
const slugify = require("slugify");
const aws = require("aws-sdk");
const formidable = require("formidable");

const fs = require("fs");
const imageThumbnail = require('image-thumbnail');
const mongoose = require("mongoose");
const fetch = require("node-fetch");

exports.createProductController = async (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.multiples = true;
    form.parse(req, async (err, fields, files) => {
        console.log(files.images);
        let imageNames = []; //init images
        //Parse fail
        if (err) {
            console.error("createProductController.parse_err: ", err);
            return res.status(400).json({
                error: "Image could not be uploaded"
            })
        }
        //Validate other fields
        let { name, description, price, category, availableQuantity, shippingProvider } = fields;
        //Check if all required fields are present and save to DB
        if (!name || !description || !price || !availableQuantity || !category || !shippingProvider) {
            return res.status(400).json({
                error: "All fields are required"
            })
        } else {
            //Save to AWS S3
            const s3 = new aws.S3({
                accessKeyId: process.env.AWS_ACCESS_ID,
                secretAccessKey: process.env.AWS_ACCESS_KEY,
            });
            //If only 1 image purposely push to image array 
            if (files.images.length === undefined) {
                files.images.length = 1;
                let obj = files.images;
                files.images = [];
                files.images.push({ ...obj });
            }
            //Iterate to validate file format
            for (let i = 0; i < files.images.length; i++) {
                //Check if images is sent.
                if (!files.images[i].path) {
                    return res.status(400).json({
                        error: "Image is required"
                    })
                }
                //Check file type
                if (files.images[i].type !== "image/jpeg" && files.images[i].type !== "image/jpg" && files.images[i].type !== "image/png") {
                    return res.status(400).json({
                        error: "Image type not allow"
                    })
                }
                //check file size more than 1mb
                if (files.images[i].size > 1000000) {
                    return res.status(400).json({
                        error: "Image should be less than 1mb"
                    })
                }
                try {
                    let fileData = fs.readFileSync(files.images[i].path); //for full file
                    // let fileDataThumbnail = await imageThumbnail(files.images[i].path);//for thumbnail display because fullfile too huge
                    await s3.putObject({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: "images/" + files.images[i].name,
                        Body: fileData,
                        ContentType: files.images[i].type
                    }).promise();
                    imageNames.push(files.images[i].name);
                }
                catch (err) {
                    console.error("S3putObjectError", err);
                    return res.status(500).json({
                        error: "Fail to create Product"
                    });
                }
            }//end for loop
            //Add images, slug, cast ShippingProvider and Subcategories to mongoose Object ID
            fields.images = imageNames;
            fields.slug = slugify(fields.name);
            fields.shippingProvider = fields.shippingProvider.split(",");
            fields.shippingProvider.map(sp => {
                return mongoose.Types.ObjectId(sp);
            });
            if (fields.subCategories && fields.subCategories.length > 0) {
                fields.subCategories = fields.subCategories.split(",");
                fields.subCategories.map(sc => {
                    return mongoose.Types.ObjectId(sc);
                });
            } else {
                fields.subCategories = null;
            }

            //Save to DB
            try {
                const product = await new Product(fields).save();
                res.send(`${product.name} has been created`);
            } catch (err) {
                console.error("createProductController^new_Product_err:", err);
                return res.status(500).json({
                    error: "Fail to create Product"
                });
            }//End Catch            
        }//end else
    });//end form parse
}

exports.listAllProductsController = async (req, res) => {
    try {
        const products = await Product.find({})
            .populate("category")
            .populate("subCategories")
            .populate("shippingProvider")
            .sort({ createdAt: -1 })
            .exec();
        res.json(products)
    } catch (err) {
        console.error("listAllProductsController_error:", err);
        return res.status(500).json({
            error: "Error Retreiving Products"
        });
    }
}

exports.deleteProductController = async (req, res) => {
    try {
        const deletedProduct = await Product.findOneAndRemove({ slug: req.params.slug }).exec();
        if (deletedProduct) {
            //get images
            let productImages = deletedProduct.images;
            console.log(productImages);
            //delete all images from S3
            //Init S3
            const s3 = new aws.S3({
                accessKeyId: process.env.AWS_ACCESS_ID,
                secretAccessKey: process.env.AWS_ACCESS_KEY,
            });
            //delete from S3, even S3 delete fail, still return success to frontend
            productImages.forEach(pi => {
                s3.deleteObject({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: "images/" + pi
                }, (err, data) => {
                    if (err) {
                        console.error("deleteProductController^s3.deleteObject err, but will still send product removed successfuly to frontend");
                    }
                })
            });
            return res.send(`${deletedProduct.name} has been deleted.`);
        } else {
            console.error("deleteProductController^Product.findOneAndRemove_err : no product found, weird");
            return res.status(400).json({
                error: "Fail to Delete Product"
            });
        }
    }
    catch (err) {
        console.error("deleteProductController^Product.findOneAndRemove_err:", err);
        return res.status(500).json({
            error: "Fail to Delete Product"
        });
    }


}

exports.getProductController = async (req, res) => {
    try {
        if (req.params.slug) {
            let product = await Product.findOne({ slug: req.params.slug })
                .populate("category")
                .populate("subCategories")
                .populate("shippingProvider")
                .exec();
            if (product) {
                return res.json(product);
            } else {
                console.error("getProductController^Product.findone: No product found");
                return res.status(400).json({
                    error: "Fail to retrieve Product"
                });
            }
        } else {
            console.error("getProductController^Slug_Not_Pass:", err);
            return res.status(400).json({
                error: "Fail to retrieve Product"
            });
        }
    } catch (err) {
        console.error("getProductController^Product.Findone_err:", err);
        return res.status(500).json({
            error: "Fail to retrieve Product"
        });
    }
}

exports.updateProductController = async (req, res) => {
    if (req.params.slug) {
        let form = new formidable.IncomingForm();
        form.keepExtensions = true;
        form.multiples = true;
        form.parse(req, async (err, fields, files) => {
            let imageNames = []; //init images
            //Parse fail
            if (err) {
                console.error("updateProductController.parse_err: ", err);
                return res.status(400).json({
                    error: "Image could not be uploaded"
                })
            } //end err
            //Validate other fields
            let { name, description, price, category, availableQuantity, shippingProvider } = fields;
            //Check if all required fields are present and save to DB
            if (!name || !description || !price || !availableQuantity || !category || !shippingProvider) {
                return res.status(400).json({
                    error: "All fields are required"
                })
            } else {
                //Init Save to AWS S3
                const s3 = new aws.S3({
                    accessKeyId: process.env.AWS_ACCESS_ID,
                    secretAccessKey: process.env.AWS_ACCESS_KEY,
                });
                //check if either old or new image is present, 1 must be present
                if (!files.newImages && !fields.oldImages) {
                    return res.status(400).json({
                        error: "Images must be uploaded"
                    })
                }
                //check if there is new images, add to aws for all new images
                if (files.newImages) {
                    //If only 1 new image purposely push to image array 
                    if (files.newImages.length === undefined) {
                        files.newImages.length = 1;
                        let obj = files.newImages;
                        files.newImages = [];
                        files.newImages.push({ ...obj });
                    }
                    //Iterate to validate file format
                    for (let i = 0; i < files.newImages.length; i++) {
                        //Check if images is sent.
                        if (!files.newImages[i].path) {
                            return res.status(400).json({
                                error: "Image is required"
                            })
                        }
                        //Check file type
                        if (files.newImages[i].type !== "image/jpeg" && files.newImages[i].type !== "image/jpg" && files.newImages[i].type !== "image/png") {
                            return res.status(400).json({
                                error: "Image type not allow"
                            })
                        }
                        //check file size more than 1mb
                        if (files.newImages[i].size > 1000000) {
                            return res.status(400).json({
                                error: "Image should be less than 1mb"
                            })
                        }
                        let fileData = fs.readFileSync(files.newImages[i].path);
                        // let fileDataThumbnail = await imageThumbnail(files.images[i].path);//for thumbnail display because fullfile too huge
                        //add to AWS 
                        try {
                            await s3.putObject({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: "images/" + files.newImages[i].name,
                                Body: fileData,
                                ContentType: files.newImages[i].type
                            }).promise();
                            imageNames.push(files.newImages[i].name);
                        } catch (err) {
                            console.error("S3putObjectError", err);
                            return res.status(500).json({
                                error: "Fail to create Product"
                            });
                        }
                    }//end forloop
                } //end if there is new images

                //get db existing product's images and compare to the oldImages sent by client, removed the one that is not sent from DB and AWS
                try {
                    const dbExistingImages = await Product.findOne({ slug: req.params.slug }).select('images').exec();
                    let tobedeletedImages;
                    //if there are old images sent by client, compare database images and old images sent by client, removed db images minus oldImages sent by client from AWS
                    if (fields.oldImages) {

                        fields.oldImages = fields.oldImages.split(",");//purpose convert to array for filter method
                        //tobedeletedImages wil db images minus oldImages sent by client.
                        tobedeletedImages = dbExistingImages.images.filter(dbimage => !fields.oldImages.includes(dbimage)).concat(fields.oldImages.filter(fieldoldImage => !dbExistingImages.images.includes(fieldoldImage)));
                        //update fields.images to all images sent by client
                        let newImages = fields.oldImages.concat(imageNames);
                        fields.images = newImages;
                    } else { //no old images, delete all old images from AWS and add new image to db
                        tobedeletedImages = dbExistingImages.images;
                        fields.images = imageNames;
                    }
                    //Init S3
                    const s3 = new aws.S3({
                        accessKeyId: process.env.AWS_ACCESS_ID,
                        secretAccessKey: process.env.AWS_ACCESS_KEY,
                    });
                    //delete from S3, even S3 delete fail, still return success to frontend
                    tobedeletedImages.forEach(tobedeletedImage => {
                        s3.deleteObject({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: "images/" + tobedeletedImage
                        }, (err, data) => {
                            if (err) {
                                console.error("updateProductController^s3.deleteObject err, but will still send product removed successfuly to frontend");
                            }
                        })
                    }); //end forEach
                    //Add slug, cast ShippingProvider and Subcategories to mongoose Object ID
                    fields.slug = slugify(fields.name);
                    fields.shippingProvider = fields.shippingProvider.split(",");
                    fields.shippingProvider.map(sp => {
                        return mongoose.Types.ObjectId(sp);
                    });
                    if (fields.subCategories && fields.subCategories.length > 0) {
                        fields.subCategories = fields.subCategories.split(",");
                        fields.subCategories.map(sc => {
                            return mongoose.Types.ObjectId(sc);
                        });
                    } else {
                        fields.subCategories = null;
                    }

                    //Update product to database
                    try {
                        const updatedProduct = await Product.findOneAndUpdate(
                            {
                                slug: req.params.slug
                            },
                            fields, //update entire request body
                            { new: true }
                        ).exec();
                        res.send(`${updatedProduct.name} has been update successfully`);
                    } catch (err) {
                        console.error("updateProductController^Product.findOneAndUpdate_err:", err);
                        return res.status(500).json({
                            error: "Fail to update Product"
                        });
                    }
                } catch (err) {
                    console.error("Product.findone_dbExistingImages", err);
                    return res.status(500).json({
                        error: "Fail to create Product"
                    });
                }
            } //end else (!name || !description || !price || !availableQuantity || !category || !shippingProvider)
        })//end form.parse
    } else {
        console.error("updateProductController^Slug_Not_Pass:", err);
        return res.status(400).json({
            error: "Fail to update Product"
        });
    }
}

// exports.uploadToTempAWSDirectory = async (req, res) => {
//     let form = new formidable.IncomingForm();
//     form.keepExtensions = true;
//     form.multiples = true;
//     form.parse(req, async (err, fields, files) => {
//         console.log(files);
//         //Parse fail
//         if (err) {
//             console.error("uploadToTempAWSDirectory.parse_err: ", err);
//             return res.status(400).json({
//                 error: "Image could not be uploaded"
//             })
//         } //end Parse fail

//         //validation
//         if (!files.images.path) {
//             return res.status(400).json({
//                 error: "Image is required"
//             })
//         }
//         //Check file type
//         if (files.images.type !== "image/jpeg" && files.images.type !== "image/jpg" && images.type !== "image/png") {
//             return res.status(400).json({
//                 error: "Image type not allow"
//             })
//         }

//         //check file size more than 1mb
//         if (files.images.size > 1000000) {
//             return res.status(400).json({
//                 error: "Image should be less than 1mb"
//             })
//         }
//         let fileData = fs.readFileSync(files.images.path);

//         //Save to AWS S3
//         const s3 = new aws.S3({
//             accessKeyId: process.env.AWS_ACCESS_ID,
//             secretAccessKey: process.env.AWS_ACCESS_KEY,
//         });
//         try {
//             console.log("******************2CREATE PRODUCT FORM 22******************")
//             console.log("inside here");
//             const awsRes = await s3.putObject({
//                 Bucket: process.env.AWS_BUCKET_NAME,
//                 Key: "images/" + files.images.name,
//                 Body: fileData,
//                 ContentType: files.images.type
//             }).promise();
//             console.log("inside here2");
//             console.log(awsRes);
//             // imageNames.push(files.images.name);
//             return res.json({
//                 uid: files.images.name,
//                 name: files.images.name,
//                 status: 'done',
//                 url: "https://mumscookydevimage.s3-ap-southeast-1.amazonaws.com/images/" + files.images.name
//             });
//         }
//         catch (err) {
//             console.error("S3putObjectError", err);
//             return res.status(500).json({
//                 error: "Fail to create Product"
//             });
//         }
//     })
// }

exports.getProductsBySearchFilterController = async (req, res) => {
    try {
        //sort =createdAt/updatedAt, 
        //order = desc/asc
        //pageNum
        const { sort, order, pageNum } = req.body;
        const currentPageNum = pageNum || 1;//if pageNum is not specify
        const productPerPage = 4;

        const products = await Product.find({})
            .skip((currentPageNum - 1) * productPerPage) //skip number of products. Example if user select page 3, it will be 3-1*2 which skipped first 8 items
            .populate("category")
            .populate("subCategories")
            .sort([[sort, order]])
            .limit(productPerPage)
            .exec();

        return res.json(products);
    } catch (err) {
        console.error("productsSearchFilterController^Product.find:", err);
        return res.status(500).json({
            error: "Fail to retrieve Product"
        });
    }
}

exports.getProductsCountController = async (req, res) => {
    try {
        const totalProductsCount = await Product.find({}).estimatedDocumentCount().exec();
        return res.json(totalProductsCount);
    } catch (err) {
        console.error("getProductsCountController^Product.find:", err);
        return res.status(500).json({
            error: "Fail to retrieve Product"
        });
    }
}

exports.getRelatedProductsController = async (req, res) => {
    try {
        const relatedProduct = await Product.find({
            _id: { $ne: req.params.productID },
            category: req.params.categoryID
        }).populate("category")
            .populate("subCategories")
            .populate("shippingProvider")
            .sort({ sold: "desc" })
            .limit(12)
            .exec();
        return res.json(relatedProduct)
    }
    catch (err) {
        console.error("getRelatedProductsController^Product.find:", err);
        return res.status(500).json({
            error: "Fail to get related products"
        });
    }
}

exports.searchController = async (req, res) => {
    const { keyword, sortBy, subCategories, minPrice, maxPrice, shippingProviders } = req.query;

    //Mongo sort parameter
    let sortQueryString;
    //mapping table for sort
    if (sortBy === "relevance") {
        sortQueryString = { score: { $meta: "textScore" } };
    } else if (sortBy === "topSales") {
        sortQueryString = { sold: -1 };
    } else if (sortBy === "priceLowToHigh") {
        sortQueryString = { price: 1 }
    } else if (sortBy === "priceHighToLow") {
        sortQueryString = { price: -1 }
    } else {
        sortQueryString = { score: { $meta: "textScore" } };
    }

    //for mongo find filter
    let queryObj = {};
    //Filter by keyword
    if (keyword) {
        queryObj.$text = {
            $search: keyword
        }
    }
    //Filter by subcategory
    if (subCategories) {
        let subCategoriesArray = subCategories.split(",");
        subCategoriesArray.map(subcategory => {
            return mongoose.Types.ObjectId(subcategory);
        });
        queryObj.subCategories = {
            $in: subCategoriesArray
        }
    }
    //Filter by price range
    if (minPrice && maxPrice && maxPrice > 0) {
        queryObj.price = {
            $gte: minPrice,
            $lte: maxPrice
        }
    }
    if (shippingProviders) {
        let shippingProvidersArray = shippingProviders.split(",");
        shippingProvidersArray.map(shippingProvider => {
            return mongoose.Types.ObjectId(shippingProvider)
        });
        queryObj.shippingProvider = {
            $in: shippingProvidersArray
        }
    }

    try {
        const searchedProduct = await Product.find(
            queryObj
        )
            .populate("category")
            .populate("subCategories")
            .sort(sortQueryString)
            .exec();

        return res.json(searchedProduct);
    } catch (err) {
        console.error("productSearchController^Product.find:", err);
        return res.status(500).json({
            error: "Fail to get search product"
        });
    }

}

exports.getProductQuantityController = async (req, res) => {

    if (req.params.productID) {
        try {
            const productQuantity = await Product.findById(req.params.productID, "availableQuantity -_id");
            if (productQuantity && productQuantity.availableQuantity) {
                return res.json(productQuantity);
            } else {
                console.error("Product not found in collection");
                return res.status(400).json({
                    error: "Error finding quanity"
                });
            }
        } catch (err) {
            console.error("Product.findById", err);
            return res.status(500).json({
                error: "Error finding quanity"
            });
        }

    } else {
        console.error("Product.find productID not pass");
        return res.status(400).json({
            error: "Error finding quanity"
        });
    }
}

// exports.getProductBySubcategoryController = async (req, res) => {
//     if (req.params.slug) {
//         const { sortBy } = req.query;

//         if (sortBy === "topSales") {
//             sortQueryString = { sold: -1 };
//         } else if (sortBy === "priceLowToHigh") {
//             sortQueryString = { price: 1 }
//         } else if (sortBy === "priceHighToLow") {
//             sortQueryString = { price: -1 }
//         } else {
//             sortQueryString = { score: { $meta: "textScore" } };
//         }
//         try {
//             const subcategoryID = await SubCategory.findOne({ slug: req.params.slug }, { _id: 1 }).exec(); //only get ID from SubCategory Document
//             const product = await Product.find({ subCategories: subcategoryID })
//                 .populate("category")
//                 .populate("subCategories")
//                 .sort(sortQueryString)
//                 .exec();
//             return res.json(product);
//         } catch (err) {
//             console.error("getProductBySubcategoryController^Product.Find:" + err);
//             return res.status(500).json({
//                 error: "Fail to retrieve Product"
//             });
//         }

//     } else {
//         console.error("getProductBySubcategoryController^Slug_Not_Pass:");
//         return res.status(400).json({
//             error: "Fail to retrieve Product"
//         });
//     }
// }