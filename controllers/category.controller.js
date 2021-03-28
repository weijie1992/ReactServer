const Category = require("../models/Category");
const slugify = require("slugify");

exports.createCategoryController = async (req, res) => {
    try {
        const { name } = req.body;
        const category = await new Category({ name, slug: slugify(name) }).save();
        // res.json({
        //     result:`${category.name} created successfully`
        // });
        res.send(`${category.name} created successfully`);
    }
    catch (err) {
        console.error("createCategoryController^new_Category_error:", err);
        return res.status(500).json({
            error: "Fail to create category"
        });
    }
}

exports.listCategoryController = async (req, res) => {
    const categories = await Category.find({}).sort({ createdAt: -1 }).exec();
    return res.json(categories);
}

exports.getCategoryController = async (req, res) => {
    try {
        const slug = req.params.slug;
        const category = await Category.findOne({ slug }).exec();
        if (!category) {
            return res.status(400).json({
                error: "No Category Found"
            });
        }
        return res.json(category);
    }
    catch (err) {
        console.error("getCategoryController^Category.findOne_error:", err);
        return res.status(500).json({
            error: "Error Retrieving Category"
        });
    }

}

exports.deleteCategoryController = async (req, res) => {
    try {
        const slug = req.params.slug;
        const deletedCategory = await Category.findOneAndRemove({ slug }).exec();
        if (!deletedCategory) {
            return res.status(400).json({
                error: "Select Category not found for delete"
            });
        }
        return res.send(`${deletedCategory.name} has been deleted`);
    }
    catch (err) {
        console.error("deleteCategoryController^Category.findOneAndDelete_error:", err);
        return res.status(500).json({
            error: "Error Deleting Category"
        });
    }
}


exports.updateCategoryController = async (req, res) => {
    try {
        const { updatedCategoryName } = req.body;
        const slug = req.params.slug;
        const updatedCategory = await Category.findOneAndUpdate({ slug }, { name:updatedCategoryName, slug: slugify(updatedCategoryName) }, { new: true }).exec();
        if (!updatedCategory) {
            return res.status(400).json({
                error: "Category not found for update"
            });
        }
        return res.send(`${slug} has been updated to ${updatedCategory.name}` );
    }
    catch (err) {
        console.error("updateCategoryController^Category.findOneAndUpdate_error:", err);
        return res.status(500).json({
            error: "Error Updating Category"
        });
    }


}