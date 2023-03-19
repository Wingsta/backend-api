import Company from "../models/company";
import { sendErrorResponse } from "../services/response/sendresponse";
import { checkIfPlanExpired } from "../utils/helperFunction";

const PlanAuth = async (req, res, next) => {
   
    const { companyId } = req.user;

    const companyData = await Company.findById(companyId);

    if (companyData?.planEndDate && checkIfPlanExpired(companyData?.planEndDate)) {
        return res.status(203).send(sendErrorResponse("Plan Expired!", 1041));
    }

    next();
};

export default PlanAuth;