const express = require("express");
const router = express.Router();

const {listShippingProviders} = require("../controllers/shippingProvider.controller");

router.get("/shippingProviders",listShippingProviders);

module.exports = router;