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

class ProfileController {
  public static async getOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = req.body.domain as IDomain;
      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }
      console.log(companyId);

      let orderDetails = await Order.find({
        userId: new ObjectId(id),
        companyId: new ObjectId(domain?.companyId),
      }).lean();

      if (orderDetails) {
        return res.json(
          sendSuccessResponse({
            orderDetails,
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
      let domain = req.body.domain as IDomain;
      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }
      console.log(companyId);

      let orderDetails = await Order.count({
        userId: new ObjectId(id),
        companyId: new ObjectId(domain?.companyId),
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
      let domain = req.body.domain as IDomain;
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
      let products = (
        await Cart.find({
          ...query,
          userId: new ObjectId(id),
        })
          .populate("productId")
          .lean()
      )?.map((it) => {
        let product = it?.productId as any as IProducts;

        return {
          name: product?.name,
          sku: product?.sku,
          quantity: it?.quantity || 1,
          thumbnail: product?.thumbnail,
          productId: product?._id,
          price: product?.price,
        };
      });

      let total = products.reduce((a, b) => {
        a.price = (a?.price || 0) + (b?.price || 0);
        return a;
      })?.price;
      let tax = total * 0.28;
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
        companyId: domain?.companyId,
        products: products,
        status: "PENDING",
        total,
        tax,
        totalAfterTax,
        deliveryAddress,
        paymentMethod,
      }).save();

      if (order?._id) {
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
      let domain = req.body.domain as IDomain;
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
        { companyId: domain?.companyId, _id: new ObjectId(orderId) },
        { $set: { status } },
        { upsert: true }
      );

      if (update?.ok) {
        return res.json(sendSuccessResponse({ message: "updated status" }));
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
}
export default ProfileController;
