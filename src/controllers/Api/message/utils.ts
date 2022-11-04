import * as Joi from "joi";

export const validateMessage = (input: object) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        mobile: Joi.string().min(13).max(13).required(),
        message: Joi.string().max(1000).required(),
    });
    
    return schema.validate(input);
};