import * as Joi from "joi";

export const validatePricingPlan = (input: any) => {

    let pricingPlan = {
        header: Joi.string().required(),
        subText: Joi.string().required(),
        amount: Joi.number().required(),
        originalAmount: Joi.number().required(),
        features: Joi.array().items(Joi.string().required()).required().min(1)
    } as any;

    const schema = Joi.object(pricingPlan);
    
    return schema.validate(input);
};