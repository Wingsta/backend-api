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
import { IAddress, IUserProfile } from "../../../interfaces/models/profile";
import Cart from "../../../models/cart";
import { ICart } from "../../../interfaces/models/cart";
import Order from "../../../models/orders";
import moment = require("moment");
import OrderHistory from "../../../models/orderhistory";

class ProfileController {
  public static async getOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      
      let { id, companyId } = req.user as { companyId: string; id: string };

         if (!id) {
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
        let mongoQuery = {
          companyId: new ObjectId(companyId),
          userId: new ObjectId(id),
        } as any;

        if (status) {
          let statusTypes = status.split(",");
          mongoQuery["status"] = { $in: statusTypes };
        }

        if (startDate) {
          if (!mongoQuery["$and"]){
             mongoQuery["$and"] = []
          }
            mongoQuery['$and'].push({createdAt : {
              $gte: moment(startDate).startOf("day").toDate(),
            }})
        }

        if (endDate) {
             if (!mongoQuery["$and"]) {
               mongoQuery["$and"] = []
             }
             mongoQuery["$and"].push({createdAt : {
               $lte: moment(endDate).endOf("day").toDate(),
             }});
          
        }

        console.log(JSON.stringify(mongoQuery))
        
        let orderDetails = await Order.find(mongoQuery)
          .sort([[sortBy, sortType === "asc" ? 1 : -1]])
          .skip(offset)
          .limit(limit)
          // .populate("userId")
          .lean();
   
   let count = await Order.count(mongoQuery);

      if (orderDetails) {
        return res.json(
          sendSuccessResponse({
            orderDetails : orderDetails,
            count,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getOrdersCount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      
      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }
      

      let orderDetails = await Order.count({
        userId: new ObjectId(id),
        companyId: new ObjectId(companyId),
      })

      if (orderDetails !== undefined) {
        return res.json(
          sendSuccessResponse({
            count : orderDetails,
          })
        );
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
  public static async postOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      
      let cartId = req.body.cartId as string[];
      let deliveryAddress = req.body.deliveryAddress as IAddress;
      let paymentMethod = req.body.paymentMethod;
      let preview = req.body.preview;

      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      if (!preview && !deliveryAddress) {
        return res.json(sendErrorResponse("deliveryAddress needed"));
      }

      if (!preview && !paymentMethod) {
        return res.json(sendErrorResponse("deliveryAddress needed"));
      }

      let query = {} as any;
      if (cartId?.length) {
        query = { _id: { $in: cartId.map((it) => new ObjectId(it)) } };
      }
      let cartIdFound = [] as string[]
      let products = (
        await Cart.find({
          ...query,
          userId: new ObjectId(id),
        })
          .populate("productId")
          .lean()
      )?.map((it) => {
        let product = it?.productId as any as IProducts;
        cartIdFound.push(it._id)
        return {
          name: product?.name,
          sku: product?.sku,
          quantity: it?.quantity || 1,
          thumbnail: product?.thumbnail,
          productId: product?._id,
          price: product?.price,
        };
      });

      console.log(products)
      const reducedProduct = products.reduce((a, b) => {
        let k = {...a}
        k.price =
          ((a?.quantity || 1) * (a?.price || 0)) + ((b?.quantity || 1) * (b?.price || 0));
        return k;
      });
      let total = products?.length
        ? (reducedProduct?.quantity || 1) * (reducedProduct?.price || 0)
        : 0;
      let tax = 0;
      let totalAfterTax = (total + tax).toFixed(2);

      if (!products) {
        return res.json(sendErrorResponse("products not found"));
      }

      if (preview)
        return res.json(
          sendSuccessResponse({
            userId: id,
            products: products,
            total,
            tax,
            totalAfterTax,
            deliveryAddress,
            paymentMethod,
          })
        );

      let order = await new Order({
        userId: new ObjectId(id),
        companyId: companyId,
        products: products,
        status: "PENDING",
        total,
        tax,
        totalAfterTax,
        deliveryAddress,
        paymentMethod,
      }).save();

      if (order?._id) {
        await Cart.deleteMany({ _id: { $in: cartIdFound.map(it => new ObjectID(it)) } });
        return res.json(
          sendSuccessResponse({
            ...order.toJSON(),
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

      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
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
        await OrderHistory.insertMany([{ orderId: id , status}]);
        return res.json(sendSuccessResponse({ message: "updated status" }));
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
}
export default ProfileController;
