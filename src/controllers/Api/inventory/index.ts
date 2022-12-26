/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { NextFunction, Request, Response } from "express";
// import fetch from "node-fetch";
import AccountUser from "../../../models/accountuser";
import { IAccountUser, ICompany } from "../../../interfaces/models/accountuser";
import * as bcrypt from "bcryptjs";
import * as typeCheckService from "../../../services/validations/typecheck";
// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectID, ObjectId } from "mongodb";

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
import Inventory from "../../../models/inventory";
import { IAddress, IUserProfile } from "../../../interfaces/models/profile";
import { authorizedMobile } from "../common/constants";
import moment = require("moment");
import { IOrderProducts } from "../../../interfaces/models/orders";
import { IIventory } from "../../../interfaces/models/inventory";
import Products from "../../../models/products";

class InventoryController {
  public static async getInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let {  companyId } = req.user as { companyId: string; id: string };

	  console.log(req.user)
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
        startDate: Date;
        endDate: Date;
        sortType: string;
        status: string;
      };

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }
      let mongoQuery = {
        companyId: new ObjectId(companyId),
      } as any;

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
      }

      if (startDate) {
        if (!mongoQuery["$and"]) {
          mongoQuery["$and"] = [];
        }
        mongoQuery["$and"].push({
          createdAt: {
            $gte: moment(startDate).startOf("day").toDate(),
          },
        });
      }

      if (endDate) {
        if (!mongoQuery["$and"]) {
          mongoQuery["$and"] = [];
        }
        mongoQuery["$and"].push({
          createdAt: {
            $lte: moment(endDate).endOf("day").toDate(),
          },
        });
      }

      let inventoryDetails = await Inventory.find(mongoQuery)
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        // .populate("userId")
        .lean();

      let count = await Inventory.count(mongoQuery);

      if (inventoryDetails) {
        return res.json(
          sendSuccessResponse({
            inventoryDetails: inventoryDetails,
            count,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async postInventory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
		let {  companyId,accountId } = req.user as { companyId: string; accountId: string };
      if (!req?.body?.products?.length) {
        return res.json(sendErrorResponse("products is incorrect"));
      }
	  let total = 0;
	       (req.body.products as IIventory["products"]).map(it => {
			total  = total + (it.purchasePrice || 0)
		   });
      const newInventory = new Inventory({
		companyId : companyId,
		userId : accountId,
        customerName: req.body.customerName,
        address: req.body.address,
        gstin: req.body.gstin,
        invoice: req.body.invoice,
        total: parseFloat(total?.toFixed(2)),
        contactPersonName: req.body.contactPersonName,
        contactPersonNumber: req.body.contactPersonNumber,
        products: req.body.products,
        status: req.body.status || "IN_STOCK",
        notes: req.body.notes,
      });

      req.body.products = await Promise.all(
        (req.body.products as IIventory["products"]).map(async (product) => {
          await Products.updateOne(
            { _id: new ObjectID(product.productId) },
            { $inc: { quantity: product.count || 0 } },
            { upsert: true }
          );
        })
      );

      const savedInventory = await newInventory.save();
      res.status(201).json(sendSuccessResponse(savedInventory));

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
}
export default InventoryController;
