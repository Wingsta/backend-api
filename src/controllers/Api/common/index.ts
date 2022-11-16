/**
 * Refresh JWToken
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from 'jsonwebtoken';
import { Request, Response } from "express";

import AccountUser from "../../../models/accountuser";
import Company from '../../../models/company';
import Locals from '../../../providers/Locals';
import {
	uploadImage,
	uploadImageForSocialLink,
} from "../../../services/gcloud/upload";
import { sendSuccessResponse } from '../../../services/response/sendresponse';

class CommonController {
	public static async upload(req: Request, res: Response, next): Promise<any> {
		try {
			const myFile = req.file as any;
			let { companyId } = req.user as { companyId: string };
			const imageUrl = await uploadImage(myFile, companyId);
			res.json(
				sendSuccessResponse({
					url: imageUrl,
				})
			);
		} catch (error) {
			next(error);
		}
	}

	public static async uploadForSocialLink(
		req: Request,
		res: Response,
		next
	): Promise<any> {
		try {
			const myFile = req.file as any;
			let { companyId } = req.user as { companyId: string };
			const imageUrl = await uploadImageForSocialLink(myFile, companyId);
			res.json(
				sendSuccessResponse({
					url: imageUrl,
				})
			);
		} catch (error) {
			next(error);
		}
	}
}

export default CommonController;
