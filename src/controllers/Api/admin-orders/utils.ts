import * as Joi from "joi";

export const validateOfflineOrder = (input: object) => {
    const schema = Joi.object({
        name: Joi.string().allow(null, '').optional(),
        mobile: Joi.string().min(13).max(13).required(),
        total: Joi.number().required(),
        products: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                sku: Joi.string().required(),
                quantity: Joi.number().required(),
                thumbnail: Joi.string().allow(null, '').optional(),
                productId: Joi.string().required(),
                price: Joi.number().required()
            })
        ).min(1).required()
    });
    
    return schema.validate(input);
};