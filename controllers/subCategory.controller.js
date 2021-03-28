const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");
const slugify = require("slugify");

exports.createSubCategoryController = async (req, res) => {
    const { name, parentCategory } = req.body;
    if (name && parentCategory) {
        try {
            const subCategory = await new SubCategory(
                {
                    name,
                    slug: slugify(name),
                    parentCategory
                }
            ).save();
            return res.send(`${subCategory.name} created successfully`);
        }
        catch (err) {
            console.error("createSubCategoryController^new_SubCategory_error:", err);
            return res.status(500).json({
                error: "Fail to create Subcategory"
            });
        }
    } else {
        return res.status(400).json({
            error: "Missing Category or SubCategory Name"
        });
    }

}
exports.listSubCategoryController = async (req, res) => {
    const subCategories = await SubCategory.find({}).populate("parentCategory").sort({ createdAt: -1 }).exec();
    // const subCategories = await SubCategory.find({}).sort({ createdAt: -1 }).exec();
    return res.json(subCategories);
}

exports.getSubCategoryController = async (req, res) => {
    if (req.params.slug) {
        try {
            const subCategory = await subCategory.findOne({ slug: req.params.slug }).exec();
            return res.json(subCategory);
        }
        catch (err) {
            console.error("getSubCategoryController^subCategor_findOne_error:", err);
            return res.status(500).json({
                error: "Error retrieving Subcategory"
            });
        }
    } else {
        return res.status(400).json({
            error: "No Subcategory found"
        });
    }
}

exports.updateSubCategoryController = async (req, res) => {
    const slug = req.params.slug;
    const { updatedParentCategory, updatedSubCategory } = req.body;
    if (slug && updatedParentCategory && updatedSubCategory) {
        try {
            const updatedSubCategoryResult = await SubCategory.findOneAndUpdate({ slug }, { name: updatedSubCategory, slug: slugify(updatedSubCategory), parentCategory: updatedParentCategory }, { new: true }).exec();
            if (!updatedSubCategoryResult) {
                return res.status(400).json({
                    error: "Subcategory not found for update"
                });
            }
            return res.send(`${slug} has been updated to ${updatedSubCategoryResult.name}`);
        } catch (err) {
            console.error("updateSubCategoryController^SubCategory.findOneAndUpdate_error:", err);
            return res.status(500).json({
                error: "Error Updating SubCategory"
            });
        }
    } else {
        console.error("updateSubCategoryController^Slug/updatedParentCategory/updatedSubCategory not passed by client");
        return res.status(400).json({
            error: "Error Updating SubCategory"
        });
    }
}

exports.deleteSubCategoryController = async (req, res) => {
    try {
        const slug = req.params.slug;
        const deletedSubCategory = await SubCategory.findOneAndRemove({ slug }).exec();
        if (!deletedSubCategory) {
            return res.status(400).json({
                error: "Select Category not found for delete"
            });
        }
        return res.send(`${deletedSubCategory.name} has been deleted`);
    }
    catch (err) {
        console.error("deleteSubCaegoryController^Category.findOneAndDelete_error:", err);
        return res.status(500).json({
            error: "Error Deleting SubCategory"
        });
    }
}

exports.listSubCategoriesByCategoryController = async (req, res) => {
    const categoryID = req.params.categoryID;
    if (categoryID) {
        try {
            const subCategories = await SubCategory.find({ parentCategory: categoryID }).exec();
            return res.json(subCategories);
        } catch (err) {
            console.error("listSubCategoriesByCategoryController^SubCategory.findOneAndUpdate_error:", err);
            return res.status(500).json({
                error: "Error displaying SubCategory"
            });
        }
    } else {
        console.error("listSubCategoriesByCategoryController^categoryID not passed by client");
        return res.status(400).json({
            error: "Error displaying SubCategory"
        });
    }
}