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
import Company from "../../../models/company";
import { checkIfPlanExpired } from "../../../utils/helperFunction";
import { SUBSCRIPTION_GST } from "../../../utils/constants";

class PlanSubscription {

    public static async getPlanDetails(req: Request, res: Response, next: NextFunction) {
        try {

            const plan = await PricingPlan.find().lean();

            let { companyId } = req.user as { companyId: string };

            const planDetails = await Company.findById(companyId).populate({
                path: "subscribedPlan",
                select: {
                    name: 1
                }
            })

            let planExpired = false;

            if (
                planDetails?.planEndDate
                &&
                checkIfPlanExpired(planDetails?.planEndDate)
            ) {
                planExpired = true;
            }

            return res.json(
                sendSuccessResponse({
                    plan,
                    gst: SUBSCRIPTION_GST,
                    planDetails,
                    planExpired
                })
            );
        } catch (error) {
            next(error);
        }
    }
}

export default PlanSubscription;
