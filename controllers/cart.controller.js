const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const e = require("express");

const checkMaxOrNegativeQuantity = async (productID, quantity) => {
    const productQuantity = await Product.findById(productID, "availableQuantity -_id").exec();
    const dbQuantity = productQuantity.availableQuantity
    if (quantity < 1) {
        quantity = 1;
    } else if (quantity > dbQuantity) {
        quantity = dbQuantity
    }
    return quantity;
}
/*
exports.addCartBeforeLoginController = async (req, res) => {
    if (req.body.cart) {
        const cartBeforeLogin = req.body.cart;
        console.log("!!!!!!!",cartBeforeLogin)
        //contruct product from localstorage
        let productObj = {};
        let localStorageProductArray = [];
        //iterate through local storage cart item and add to cart collection
        for (let i = 0; i < cartBeforeLogin.length; i++) {
            let product = cartBeforeLogin[i];
            productObj.product = product._id;
            // //check quantity ensure that it does not reach maximum or negative
            // product.quantity = await checkMaxOrNegativeQuantity(product._id, product.quantity);
            productObj.purchaseQuantity = product.quantity;
            //get product price from database instead as it is safer
            let dbProductPrice = await Product.findById(product._id, 'price -_id').exec();
            productObj.totalPriceWithQuantity = dbProductPrice.price * product.quantity;
            localStorageProductArray.push(productObj);
            productObj = {};
        }
        try {
            let cartFromDB = await Cart.findOne({ userID: req.user._id }).exec();
            if (cartFromDB && cartFromDB.products) { //product found append to users cart
                //Check product from local storage same as product in DB, if same append quantity, else add to products array
                for (let i = 0; i < cartFromDB.products.length; i++) {
                    let productIDFromDB = cartFromDB.products[i].product;
                    for (let j = 0; j < localStorageProductArray.length; j++) {
                        let productIDfromLocalStorage = localStorageProductArray[j].product;
                        if (productIDFromDB == productIDfromLocalStorage) {//if same product found, update quantity, remove from localstorage array.
                            cartFromDB.products[i].purchaseQuantity += localStorageProductArray[j].purchaseQuantity;
                            cartFromDB.products[i].totalPriceWithQuantity += localStorageProductArray[j].totalPriceWithQuantity;
                            localStorageProductArray.splice(j, 1);
                            j--;
                        }
                    }
                } //end for loop i
                //localStorageProductArray left with new products concat and update cart document
                cartFromDB.products = cartFromDB.products.concat(localStorageProductArray);
                cartFromDB.save(async (err, cart) => {
                    if (err) {
                        console.error("cartBeforeLoginController^cartFromDB.save_err:", err);
                        return res.status(500).json({
                            error: "Login error please try again"
                        });
                    } else {
                        //popuate every product in products table because client side require all product properties
                        cart.populate("products.product", (err, populatedResult) => {
                            if (err) {
                                console.error("cartBeforeLoginController^Cart.findById_err:", err);
                                return res.status(500).json({
                                    error: "Login error please try again"
                                });
                            } else {
                                //Mapping, send client what client is required
                                const response = populatedResult.products.map(p => {
                                    let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                                    obj.quantity = p.purchaseQuantity;
                                    return obj;
                                });
                                return res.json(response);
                            } //end else no error for populate
                        }); //end cart.populate
                    }// end else no error for save
                }); //end cartFromDB.save
            } else { //user do not have a cart document, create new cart document using local storage
                //add a document to cart collection
                const newCart = new Cart({
                    products: localStorageProductArray,
                    userID: req.user._id
                });
                newCart.save((err, cart) => {
                    if (err) {
                        console.error("cartBeforeLoginController^newCart.save_err:", err);
                        return res.status(500).json({
                            error: "Login error please try again"
                        });
                    } else {
                        //popuate every product in products table because client side require all product properties
                        cart.populate("products.product", (err, populatedResult) => {
                            if (err) {
                                console.error("cartBeforeLoginController^Cart.findById_err:", err);
                                return res.status(500).json({
                                    error: "Login error please try again"
                                });
                            } else {
                                //Mapping, send client what client is required
                                const response = populatedResult.products.map(p => {
                                    let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                                    obj.quantity = p.purchaseQuantity;
                                    return obj;
                                });
                                return res.json(response);
                            } //end else no error for populate
                        });//end cart.populate
                    }// end else no error for save
                });//end newCart.save
            }//end else user do not have a cart document, create new cart
        } catch (err) {
            console.error("cartBeforeLoginController^Cart.findOne_err:", err);
            return res.status(500).json({
                error: "Login error please try again"
            });
        }
    } else { //No cart item passed
        return res.status(201).end();
    }
}
*/
exports.addCartBeforeLoginController = async (req, res) => {
    if (req.body.cart) {
        const cartBeforeLogin = req.body.cart;
        //contruct product array from localstorage
        let productObj = {};
        let localStorageProductArray = [];

        //iterate through local storage cart item and add to cart collection
        for (let i = 0; i < cartBeforeLogin.length; i++) {
            let product = cartBeforeLogin[i];
            productObj.product = product._id;
            productObj.purchaseQuantity = product.quantity;
            //get product price from database instead as it is safer
            let dbProductPrice = await Product.findById(product._id, 'price availableQuantity -_id').exec();
            //store product availablequantity and price to check the total quantity and calculate price incase it user purchaseQuantity exceeds
            productObj.availableQuantity = dbProductPrice.availableQuantity;
            productObj.price = dbProductPrice.price;
            //productObj.totalPriceWithQuantity = dbProductPrice.price * product.quantity;
            localStorageProductArray.push(productObj);
            productObj = {};
        }

        try {
            //find user's cart
            let cartFromDB = await Cart.findOne({ userID: req.user._id }).exec();
            if (cartFromDB && cartFromDB.products) { //if user have cart
                //Check product from local storage same as product in DB, if same append quantity, else add to products array
                for (let i = 0; i < cartFromDB.products.length; i++) {
                    let productIDFromDB = cartFromDB.products[i].product;
                    for (let j = 0; j < localStorageProductArray.length; j++) {
                        let productIDfromLocalStorage = localStorageProductArray[j].product;
                        if (productIDFromDB == productIDfromLocalStorage) {//if same product found, update quantity, remove from localstorage array.
                            cartFromDB.products[i].purchaseQuantity += localStorageProductArray[j].purchaseQuantity; //append quantity
                            //check if quantity is greater than avaiable quantity, set to avaiable quantity
                            if (cartFromDB.products[i].purchaseQuantity > localStorageProductArray[j].availableQuantity) {
                                cartFromDB.products[i].purchaseQuantity = localStorageProductArray[j].availableQuantity;
                            }
                            cartFromDB.products[i].totalPriceWithQuantity = cartFromDB.products[i].purchaseQuantity * localStorageProductArray[j].price; //calculate price
                            //delete availableQuantity and price and remove the entire obj from localstorage array as we dont need to concat later
                            delete localStorageProductArray[j].availableQuantity;
                            delete localStorageProductArray[j].price;
                            localStorageProductArray.splice(j, 1);
                            j--;
                        } else {// user dont have cart, 
                            //check if quantity is greater than avaiable quantity, set to avaiable quantity
                            if (localStorageProductArray[j].purchaseQuantity > localStorageProductArray[j].availableQuantity) {
                                localStorageProductArray[j].purchaseQuantity = localStorageProductArray[j].availableQuantity;
                            }
                            //calculate total price
                            localStorageProductArray[j].totalPriceWithQuantity = localStorageProductArray[j].purchaseQuantity * localStorageProductArray[j].price;
                        }
                    }//end for loop j
                } //end for loop i
                //remove totalPriceWithQuantity and  price property as we dont need to concat with collection
                for (let i = 0; i < localStorageProductArray.length; i++) {
                    delete localStorageProductArray[i].totalPriceWithQuantity;
                    delete localStorageProductArray[i].price;
                }

                //localStorageProductArray left with new products concat and update cart document
                cartFromDB.products = cartFromDB.products.concat(localStorageProductArray);
                cartFromDB.save(async (err, cart) => {
                    if (err) {
                        console.error("cartBeforeLoginController^cartFromDB.save_err:", err);
                        return res.status(500).json({
                            error: "Login error please try again"
                        });
                    } else {
                        //popuate every product in products table because client side require all product properties
                        cart.populate("products.product", (err, populatedResult) => {
                            if (err) {
                                console.error("cartBeforeLoginController^Cart.findById_err:", err);
                                return res.status(500).json({
                                    error: "Login error please try again"
                                });
                            } else {
                                //Mapping, send client what client is required
                                const response = populatedResult.products.map(p => {
                                    let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                                    obj.quantity = p.purchaseQuantity;
                                    return obj;
                                });
                                return res.json(response);
                            } //end else no error for populate
                        }); //end cart.populate
                    }// end else no error for save
                }); //end cartFromDB.save
            } else { //user do not have a cart document, create new cart document using local storage
                //Calculate totalprice and check quantity does not exceet avaialable quantity after that, remove totalPriceWithQuantity and  price property as we dont need to concat with collection
                for (let i = 0; i < localStorageProductArray.length; i++) {
                    //check if quantity is greater than avaiable quantity, set to avaiable quantity
                    if (localStorageProductArray[i].purchaseQuantity > localStorageProductArray[i].availableQuantity) {
                        localStorageProductArray[i].purchaseQuantity = localStorageProductArray[i].availableQuantity;
                    }
                    //calculate total price
                    localStorageProductArray[i].totalPriceWithQuantity = localStorageProductArray[i].purchaseQuantity * localStorageProductArray[i].price;
                    delete localStorageProductArray[i].price;
                }
                //add a document to cart collection
                const newCart = new Cart({
                    products: localStorageProductArray,
                    userID: req.user._id
                });
                newCart.save((err, cart) => {
                    if (err) {
                        console.error("cartBeforeLoginController^newCart.save_err:", err);
                        return res.status(500).json({
                            error: "Login error please try again"
                        });
                    } else {
                        //popuate every product in products table because client side require all product properties
                        cart.populate("products.product", (err, populatedResult) => {
                            if (err) {
                                console.error("cartBeforeLoginController^Cart.findById_err:", err);
                                return res.status(500).json({
                                    error: "Login error please try again"
                                });
                            } else {
                                //Mapping, send client what client is required
                                const response = populatedResult.products.map(p => {
                                    let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                                    obj.quantity = p.purchaseQuantity;
                                    return obj;
                                });
                                return res.json(response);
                            } //end else no error for populate
                        });//end cart.populate
                    }// end else no error for save
                });//end newCart.save
            }//end else user do not have a cart document, create new cart
        } catch (err) {
            console.error("cartBeforeLoginController^Cart.findOne_err:", err);
            return res.status(500).json({
                error: "Login error please try again"
            });
        }
    } else { //No cart item passed
        return res.status(201).end();
    }
}

exports.getUserCartOnLoginController = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userID: req.user._id })
            .populate("products.product")
            .exec();
        if (cart) {
            const response = cart.products.map(p => {
                let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                obj.quantity = p.purchaseQuantity;
                return obj;
            });
            return res.json(response);
        }
        return res.json([]);
    } catch (err) {
        console.error("getUserCartOnLoginController^Cart.findOne_err:", err);
        return res.status(500).json({
            error: "Login error please try again"
        });
    }
}

exports.deleteSingleCartItemController = async (req, res) => {
    if (req.params.productID) {
        try {
            //find user cart
            const findUserCart = await Cart.findOne(
                { userID: req.user._id }).exec();
            if (findUserCart) {
                let countNumberOfFilter = 0;
                //get updated cart after item is removed.
                const cartAfterRemoved = findUserCart.products.filter((product) => {
                    console.log(product);
                    if (product.product._id != req.params.productID) {
                        return product.product._id != req.params.productID;
                    } else {
                        countNumberOfFilter++;
                    }
                });
                if (countNumberOfFilter === 1) { //ensure only 1 item is deleted.
                    //update the removed item
                    findUserCart.products = cartAfterRemoved;
                    findUserCart.save((err, deletedCart) => { //update user cart based on updated item
                        if (err) {
                            return res.status(500).json({
                                error: "Server Error, please try again"
                            });
                        } else {
                            deletedCart.populate("products.product", (err, populatedResult) => {
                                if (err) {
                                    console.error("cartBeforeLoginController^Cart.findById_err:", err);
                                    return res.status(500).json({
                                        error: "Login error please try again"
                                    });
                                } else {
                                    //Mapping, send client what client is required
                                    const response = populatedResult.products.map(p => {
                                        let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                                        obj.quantity = p.purchaseQuantity;
                                        return obj;
                                    });
                                    return res.json(response);
                                } //end else no error for populate
                            });//end cart.populate
                        }
                    }); //end findUserCart
                } else { //deleted item More than 1
                    console.error("deleteSingleCartItemController^countNumberOfFilter!==1:");
                    return res.status(400).json({
                        error: "Server Error, please try again"
                    });
                } //else deleted item more than 1
            } else { //user cart not found in DB
                console.error("deleteSingleCartItemController^UserCARTNOTFOUND");
                return res.status(500).json({
                    error: "Server Error, please try again"
                });
            } //end else user cart not found in DB
        } catch (err) {
            console.error("deleteSingleCartItemController^Cart.findOne_err:", err);
            return res.status(500).json({
                error: "Server Error, please try again"
            });
        } //end catch
    } else { // else if req.params.productID not pass
        console.error("deleteSingleCartItemController^Product ID not passed");
        return res.status(400).json({
            error: "Server Error, please try again"
        });
    }
}


exports.addToCartController = async (req, res) => {
    if (req.body.productID && req.body.purchaseQuantity) {
        try {
            //get product price from DB as it is safer
            const dbProductPrice = await Product.findById(req.body.productID, "price -_id").exec();
            //Check if user cart is exist
            let userCart = await Cart.findOne({ userID: req.user._id }).exec();
            if (userCart) { //if user have a cart but products is empty
                let hasCartAppended = false; //check if product exist in user cart, if product exist add quantity and price, else add the product obj to cart
                for (let i = 0; i < userCart.products.length; i++) {
                    if (userCart.products[i].product == req.body.productID) {
                        userCart.products[i].purchaseQuantity += req.body.purchaseQuantity;
                        //check quantity ensure that it does not reach maximum or negative
                        userCart.products[i].purchaseQuantity = await checkMaxOrNegativeQuantity(req.body.productID, userCart.products[i].purchaseQuantity);
                        userCart.products[i].totalPriceWithQuantity = userCart.products[i].purchaseQuantity * dbProductPrice.price;
                        hasCartAppended = true;
                        break;
                    }
                }
                if (!hasCartAppended) {
                    //if product not exist, add to products array
                    let productObj = {};
                    productObj.product = req.body.productID;
                    productObj.purchaseQuantity = req.body.purchaseQuantity;
                    //check quantity ensure that it does not reach maximum or negative
                    productObj.purchaseQuantity = await checkMaxOrNegativeQuantity(req.body.productID, productObj.purchaseQuantity);
                    productObj.totalPriceWithQuantity = productObj.purchaseQuantity * dbProductPrice.price;
                    userCart.products.push(productObj);
                }
                //save to document
                userCart.save((err, cart) => {
                    if (err) {
                        console.error("addToCartController^appendCart.save_err:", err);
                        return res.status(500).json({
                            error: "Fail to add to cart, please try again"
                        });
                    } else {
                        cart.populate("products.product", (err, populatedResult) => {
                            if (err) {
                                return res.status(500).json({
                                    error: "Fail to add to cart, please try again"
                                });
                            } else {
                                //Mapping, send client what client is required
                                const response = populatedResult.products.map(p => {
                                    let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                                    obj.quantity = p.purchaseQuantity;
                                    return obj;
                                });
                                return res.json(response);
                            }//end else no error for cart.populate
                        });//end cart.populate
                    }//end else userCart.save no error
                });//end userCart.save 
            } else { //user no cart, create
                //construct products array insert to a new document
                let productArray = [];
                let productObj = {};
                productObj.product = req.body.productID;
                productObj.purchaseQuantity = req.body.purchaseQuantity;
                //check quantity ensure that it does not reach maximum or negative
                productObj.purchaseQuantity = await checkMaxOrNegativeQuantity(req.body.productID, productObj.purchaseQuantity);
                productObj.totalPriceWithQuantity = productObj.purchaseQuantity * dbProductPrice.price;
                productArray.push(productObj);
                //insert a new document
                const newCart = new Cart({
                    products: productArray,
                    userID: req.user._id
                });
                newCart.save((err, cart) => {
                    if (err) {
                        console.error("addToCartController^newCart.save_err:", err);
                        return res.status(500).json({
                            error: "Fail to add to cart, please try again"
                        });
                    } else {
                        cart.populate("products.product", (err, populatedResult) => {
                            if (err) {
                                return res.status(500).json({
                                    error: "Fail to add to cart, please try again"
                                });
                            } else {
                                //Mapping, send client what client is required
                                const response = populatedResult.products.map(p => {
                                    let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                                    obj.quantity = p.purchaseQuantity;
                                    return obj;
                                });
                                return res.json(response);
                            }//end else no error for cart.populate
                        });//end cart.populate
                    }//end else no error Cart.findOne
                }); //end newCart.save
            } //end else user has no cart
        } catch (err) {
            console.error("addToCartController^Product.findById_err:", err);
            return res.status(500).json({
                error: "Fail to add to cart, please try again"
            });
        }
    } else {
        console.error("addToCartController^ProductID_AND_purchaseQuantity_NOTSENT_err:", err);
        return res.status(400).json({
            error: "Server Error"
        });
    }
}

exports.updateCartQuantityController = async (req, res) => {
    if (req.body.productID && req.body.updateQuantity) {
        try {
            //get users cart
            const userCart = await Cart.findOne({ userID: req.user._id }).exec();
            if (userCart) { //user has a cart
                let hasProductUpdated = false; //check if product updated, if not throw error
                //get product price from DB as it is safer
                const dbProductPrice = await Product.findById(req.body.productID, "price -_id").exec();
                //update product
                for (let i = 0; i < userCart.products.length; i++) {
                    if (userCart.products[i].product == req.body.productID) {
                        userCart.products[i].purchaseQuantity = req.body.updateQuantity;
                        //check quantity ensure that it does not reach maximum or negative
                        userCart.products[i].purchaseQuantity = await checkMaxOrNegativeQuantity(req.body.productID, userCart.products[i].purchaseQuantity);
                        userCart.products[i].totalPriceWithQuantity = dbProductPrice.price * userCart.products[i].purchaseQuantity;
                        hasProductUpdated = true;
                        break;
                    }
                }
                //if product updated, save to collection
                if (hasProductUpdated) {
                    userCart.save((err, updatedUserCart) => {
                        if (err) {
                            console.error("updateCartQuantityController^userCart.save", err);
                            return res.status(400).json({
                                error: "Fail to update quantity, please try again"
                            });
                        } else {
                            updatedUserCart.populate("products.product", (err, populatedResult) => {
                                if (err) {
                                    console.error("updateCartQuantityController^populate", err);
                                    return res.status(500).json({
                                        eerror: "Fail to update quantity, please try again"
                                    });
                                } else {
                                    //Mapping, send client what client is required
                                    const response = populatedResult.products.map(p => {
                                        let obj = JSON.parse(JSON.stringify(p.product)); //copy entire object
                                        obj.quantity = p.purchaseQuantity;
                                        return obj;
                                    });
                                    return res.json(response);
                                }//end else no error for cart.populate
                            });//end cart.populate
                        }// end else userCart save
                    });// end userCart save
                } else {
                    console.error("updateCartQuantityController^CartItemNotFound_SoCantUpdate");
                    return res.status(400).json({
                        error: "Fail to update quantity, please try again"
                    });
                } //end else hasProductUpdated false, product notupdated
            } else {
                console.error("updateCartQuantityController^UserCartNotFound");
                return res.status(500).json({
                    error: "Fail to update quantity, please try again"
                });
            } //end else user dont have cart
        } catch (err) {
            console.error("updateCartQuantityController^Cart.findOne_err:", err);
            return res.status(500).json({
                error: "Fail to update quantity, please try again"
            });
        }
    } else {
        console.error("updateCartQuantityController^ProductID_AND_updateQuantity_NOTSENT_err:", err);
        return res.status(400).json({
            error: "Server Error"
        });
    }//end productID or update quantity not pass by client
}