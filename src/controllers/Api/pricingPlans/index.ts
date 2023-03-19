/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { NextFunction, Request, Response } from "express";
import {
    sendErrorResponse,
    sendSuccessResponse,
} from "../../../services/response/sendresponse";
import PricingPlan from "../../../models/pricingPlan";
import { validatePricingPlan } from "./utils";
import { IPricingPlan } from "../../../interfaces/models/pricingPlan";

class PricingPlans {

    public static async getPricingPlans(req: Request, res: Response, next: NextFunction) {
        try {

            const data = await PricingPlan.find().lean();

            return res.json(
                sendSuccessResponse(data)
            );
        } catch (error) {
            next(error);
        }
    }

    public static async createPricingPlan(req: Request, res: Response, next: NextFunction) {
        try {

            const { error } = validatePricingPlan(req.body);

            if (error) {
                return res.status(400).send(sendErrorResponse(error.details[0].message));
            }

            let {
                name,
                subText,
                amount,
                originalAmount,
                features
            } = req.body as IPricingPlan

            const data = await PricingPlan.create({
                name,
                subText,
                amount,
                originalAmount,
                features
            });

            return res.json(
                sendSuccessResponse("Pricing plan created successfully!")
            );
        } catch (error) {
            next(error);
        }
    }
}

export default PricingPlans;
