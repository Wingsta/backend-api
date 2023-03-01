import Configuration from "../models/configuration";
import { configurationTypes, notificationConfigConstant } from "./constants";

export const checkNotification = async (companyId: string, key: string):Promise<Boolean> => {
    try {
        let notificationConfig = {} as any;
        
        notificationConfig = await Configuration.findOne({
            companyId,
            type: configurationTypes.NOTIFICATION
        });

        notificationConfig = notificationConfig?.data || {};

        notificationConfig = {
            ...notificationConfigConstant,
            ...notificationConfig
        }

        return notificationConfig[key] ? true : false;      
    } catch (e) {
        return false;
    }
}