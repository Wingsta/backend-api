/**
 * Refresh JWToken
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";
const path = require("path");
import AccountUser from "../../../models/accountuser";
import Company from "../../../models/company";
import Locals from "../../../providers/Locals";
import {
  uploadImage,
  uploadImageForSocialLink,
  compressImages,
} from "../../../services/gcloud/upload";
import { sendSuccessResponse } from "../../../services/response/sendresponse";
import * as sharp from "sharp";
class CommonController {
  public static appendTimestampToFileName(fileName: string) {
    const timestamp = Date.now();
    const parts = fileName.split(".");
    const extension = parts.pop();
    const newFileName = parts.join(".") + "_" + timestamp + "." + extension;
    return newFileName;
  }
  public static async upload(req: Request, res: Response, next): Promise<any> {
    try {
      let myFile = req.file as any;
      let compress = req.query.compress;
      myFile.originalname = CommonController.appendTimestampToFileName(
        myFile.originalname
      );
      if (myFile?.mimetype?.startsWith("image/") && compress === "true") {
        let buffer = await sharp(myFile.buffer)
          .webp({ quality: 80 })
          .resize(3840, 3840, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0.0 },
          })
          .toBuffer();

        myFile = {
          buffer: buffer,
          originalname: `${path.parse(myFile.originalname).name}.webp`,
        };
      }
      // return res.json({name : myFile.originalname});
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
