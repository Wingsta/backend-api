/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { NextFunction, Request, Response } from "express";
import AccountUser from "../../../models/accountuser";
import { IAccountUser, ICompany } from "../../../interfaces/models/accountuser";
import * as bcrypt from "bcryptjs";
import * as typeCheckService from "../../../services/validations/typecheck";
// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectId } from "mongodb";

import axios, { AxiosRequestConfig } from "axios";

import * as XLSX from "xlsx";
import Company from "../../../models/company";
import Product from "../../../models/products";
import { IProducts } from "../../../interfaces/models/products";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../services/response/sendresponse";
import { uploadImage } from "../../../services/gcloud/upload";
import Domain from "../../../models/domain";
import { IDomain } from "../../../interfaces/models/domains";
import Profile from "../../../models/profile";
import { IAddress, IUserProfile } from "../../../interfaces/models/profile";

class ProfileController {
  public static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId, id } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let profileDetails = await Profile.findOne({
        _id: id,
        companyId: companyId,
      });
      if (profileDetails?._id) {
        const token = jwt.sign(
          {
            mobile: profileDetails.mobile,
            id: profileDetails?._id,
            companyId: companyId,
          },
          Locals.config().profileSecret,
          {
            expiresIn: 60 * 60 * 30,
          }
        );
        return res.json(
          sendSuccessResponse({
            message: "account created",
            token: token,
            profileDetails,
          })
        );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
  public static async postProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = req.body.domain as IDomain;
      let mobile = req.body.mobile;
      let otp = req.body.otp;

      if (!domain) {
        return res.json(sendErrorResponse("domainId needed"));
      }

      if (!mobile) {
        return res.json(sendErrorResponse("mobileNumber needed"));
      }

      if (!otp || otp !== "123456") {
        return res.json(sendErrorResponse("otp missing/incorrect"));
      }

      let profile = await Profile.findOne({
        mobile: mobile,
        companyId: domain?.companyId,
      }).lean();

      if (!profile?._id)
        profile = await new Profile({
          mobile: mobile,
          companyId: domain?.companyId,
        }).save();

      if (profile?._id) {
        const token = jwt.sign(
          {
            mobile: profile.mobile,
            id: profile?._id,
            companyId: domain?.companyId,
          },
          Locals.config().profileSecret,
          {
            expiresIn: 60 * 60 * 30,
          }
        );
        return res.json(
          sendSuccessResponse({ message: "account created", token: token })
        );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async patchProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      
      let profile = (req.user as any)?.id as string;
      let companyId = (req.user as any)?.companyId as string;
      let profilePatchDetails = req.body.profile as IUserProfile;
   
      if (!profile || !profilePatchDetails) {
        return res.json(sendErrorResponse("profileId needed"));
      }

      let profileDetails = await Profile.findOne({
        _id: profile,
        companyId: companyId,
      }).lean();

      if (profileDetails?._id) {
        let id = profileDetails?._id;
        delete profileDetails._id;
        delete profileDetails.__v;

        let update = await Profile.updateOne(
          { _id: id },
          { $set: { ...profileDetails, ...profilePatchDetails } },
          { upsert: true }
        );

        if (!!update.ok)
          return res.json(
            sendSuccessResponse({
              message: "account updated",
              _id: id,
              profileDetails: { ...profileDetails, ...profilePatchDetails },
            })
          );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async postAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      
      let profile = (req.user as any)?.id as string;

      let address = req.body.address as IAddress;
   

      if ( !address) {
        return res.json(sendErrorResponse("address needed"));
      }

      if (profile) {
        let id = profile;

         if (address.default) {
          
           await Profile.updateOne(
             { _id: id, "address" : {$exists : true} },
             { $set: { "address.$.default": false } },
             { upsert: true }
           );
         }
         
        let update = await Profile.updateOne(
          { _id: id },
          { $push: { address } },
          { upsert: true }
        );

        if (!!update.ok)
          return res.json(
            sendSuccessResponse({
              message: "address added",
            })
          );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async patchAddress(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      
      let profile = (req.user as any)?.id as string;
      let addressId = req.params.addressId as string;
      let address = req.body.address as IAddress;
    

      if ( !address) {
        return res.json(sendErrorResponse("address needed"));
      }

         if (!addressId) {
           return res.json(sendErrorResponse("addressId needed"));
         }



      if (profile) {
        let id = profile;

        if(address.default){
          await Profile.updateOne(
            { _id: id, address: { $exists: true } },
            { $set: { "address.$.default": false } },
            { upsert: true }
          );
        }

        let update = await Profile.updateOne(
          { _id: id, "address._id": addressId },
          { $set: {address : {_id : addressId,...address} }},
          { upsert: true }
        );

        if (!!update.ok)
          return res.json(
            sendSuccessResponse({
              message: "address updated",
            })
          );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async verifyProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = req.body.domain;
      let mobile = req.params.mobile;

      if (!domain) {
        return res.json(sendErrorResponse("domainId needed"));
      }

      if (!mobile) {
        return res.json(sendErrorResponse("mobileNumber needed"));
      }
      return res.json(sendSuccessResponse({ message: "otp sent" }));
    } catch (error) {
      next(error);
    }
  }
}
export default ProfileController;
