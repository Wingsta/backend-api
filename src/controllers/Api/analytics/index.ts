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
import * as fs from "fs";
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
import moment = require("moment");
import { ORDER_STATUS, PAYMENT_METHOD } from "../../../utils/constants";
import { validateOfflineOrder } from "./utils";

const PDFDocument = require("pdf-lib").PDFDocument;
import { createInvoice } from "../orders/pdfkit";
import { sendStatusUpdateEmail } from "../../../utils/notification";

class AdminOrderController {
  public static async getAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { companyId } = req.user as { companyId: string };
      let dateRange = req.query as { fromDate : string, toDate : string};

      if (!companyId) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      
      if (!dateRange) {
        return res.json(sendErrorResponse("date range missing"));
      }
     
      let totalSales = (await Order.aggregate([
        {
          $match: {
            companyId: new ObjectId(companyId),
            createdAt: {
              $gte: new Date(dateRange.fromDate),
              $lte: new Date(dateRange.toDate),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalValue: { $sum: "$totalAfterTax" },
            offlineValue: {
              $sum: { $cond: ["$offline", "$totalAfterTax", 0] },
            },
          },
        },
      ]))?.[0];

      let avgDailySales = (await Order.aggregate([
        {
          $match: {
            companyId: new ObjectId(companyId),
            createdAt: {
              $gte: new Date(dateRange.fromDate),
              $lte: new Date(dateRange.toDate),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            dailySales: { $sum: "$totalAfterTax" },
          },
        },
        {
          $group: {
            _id: null,
            avgDailySales: { $avg: "$dailySales" },
            dailySales: { $push: { day: "$_id", sales: "$dailySales" } },
          },
        },
      ]))?.[0];

          

      let customers = await Profile.count({companyId , createdAt : {$gte : new Date(dateRange.fromDate), $lte : new Date(dateRange.toDate)}}).lean()
      let orders = await Order.count({
        companyId,
        createdAt: {
          $gte: new Date(dateRange.fromDate),
          $lte: new Date(dateRange.toDate),
        },
      }).lean();

      let latestOrders = await Order.find({
        companyId,
        createdAt: {
          $gte: new Date(dateRange.fromDate),
          $lte: new Date(dateRange.toDate),
        },
      }).populate('userId').sort([["-id",-1]]).limit(7).lean();
      console.log(JSON.stringify({companyId , createdAt : {$gte : new Date(dateRange.fromDate), $lte : new Date(dateRange.toDate)}}))
      return res.json(
        sendSuccessResponse({
          totalSales,
          avgDailySales,
          customers,
          orders,
          latestOrders,
        })
      );
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
}
export default AdminOrderController;


