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
import Cart from "../../../models/cart";
import { ICart } from "../../../interfaces/models/cart";
import Order from "../../../models/orders";
import OrderHistory from "../../../models/orderhistory";

class ProfileController {
  public static async getOneOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };

      if (!companyId) {
        return res.json(sendErrorResponse("unauthorised"));
      }

     let id = req.params.id as string
     if(!id){
      return res.json(sendErrorResponse("id missing"));
     }

      
      let orderDetails = await Order.findOne({_id : new ObjectId(id)})
       
        .lean();

      let orderhistory = await OrderHistory.find({
        orderId: new ObjectId(id),
      })
        .sort([['createdAt', -1]])
        .populate('userId')
        .limit(5);

      if (orderDetails) {
        return res.json(
          sendSuccessResponse({
            orderDetails,
            orderhistory,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };

      if (!companyId) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let {
        limit = 10,
        offset = 0,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortType = "desc",
        status,
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        startDate: string;
        endDate: string;
        sortType: string;
        status: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }
      let mongoQuery = { companyId: new ObjectId(companyId) } as any;

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
      }

      if (startDate) {
        mongoQuery["createdAt"] = { $gte: new Date(startDate) };
      }

      if (endDate) {
        mongoQuery["createdAt"] = { $lte: new Date(endDate) };
      }

      console.log(mongoQuery);
      let orderDetails = await Order.find(mongoQuery)
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        .populate("userId")
        .lean();

      let count = await Order.count(mongoQuery);

      if (orderDetails) {
        return res.json(
          sendSuccessResponse({
            orderDetails,
            count,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async statusUpdate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let orderId = req.params.orderId as string;

      let status = req.body.status as string;

      let { companyId } = req.user as { companyId: string };

      if (!companyId) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      if (!status) {
        return res.json(sendErrorResponse("status needed"));
      }

      let update = await Order.updateOne(
        { companyId: companyId, _id: new ObjectId(orderId) },
        { $set: { status } },
        { upsert: true }
      );

      if (update?.ok) {
        await OrderHistory.insertMany([{ orderId, status }]);
        return res.json(sendSuccessResponse({ message: "updated status" }));
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
}
export default ProfileController;
