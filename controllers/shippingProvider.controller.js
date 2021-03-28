const ShippingProvider = require("../models/ShippingProvider");


exports.listShippingProviders = async (req, res) => {
    const shippingProviders = await ShippingProvider.find({}).sort({ createdAt: -1 }).exec();
    return res.json(shippingProviders);
}