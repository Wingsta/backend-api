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
import { uploadImage } from '../../../services/gcloud/upload';
import { sendSuccessResponse } from '../../../services/response/sendresponse';

class CommonController {
  public static async upload(req: Request, res: Response, next): Promise<any> {
    try {
      
      const myFile = req.file as any;
      const imageUrl = await uploadImage(myFile);
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
