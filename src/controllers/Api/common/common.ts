import Category from '../../../models/category';
import Product from '../../../models/products';

export const updateCategoryProduct = async (categoryId) => {
    try {
        let productCount = await Product.countDocuments({
            categoryId
        })

        await Category.findByIdAndUpdate(categoryId, { productCount })
    } catch (error) {
        
    }
}