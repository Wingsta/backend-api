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
import { IUserProfile } from "../../../interfaces/models/profile";
import Cart from "../../../models/cart";
import { ICart } from "../../../interfaces/models/cart";

class ProfileController {
  public static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      let { id } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let cartDetails = await Cart.find({
        userId: id,
      })
        .populate("productId")
        .lean();

      if (cartDetails) {
        return res.json(
          sendSuccessResponse({
            cartDetails,
          })
        );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getCartCount(req: Request, res: Response, next: NextFunction) {
    try {
      let { id } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let cartDetails = (await Cart.aggregate([
        {
          $match: {
            userId: new ObjectID(id),
          },
        },
        {
          $group: {
            _id: {},
            quantity: {
              $sum: "$quantity",
            },
          },
        },
      ]))?.[0]?.quantity;

      console.log(
        await Cart.aggregate([
          {
            $match: {
              userId: id,
            },
          },
          {
            $group: {
              _id: {},
              quantity: {
                $sum: "$quantity",
              },
            },
          },
        ])
      );
      if (cartDetails !== undefined ) {
        return res.json(
          sendSuccessResponse({
           count :  cartDetails,
          })
        );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
  public static async postCart(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      
      let cartDetails = req.body.cartDetails as ICart;
      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!cartDetails) {
        return res.json(sendErrorResponse("cartDetails needed"));
      }

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let productDetails = await Product.findOne({
        _id: new ObjectId(cartDetails?.productId),
        companyId: new ObjectId(companyId),
      }).lean();
      console.log(
        {
          _id: new ObjectId(cartDetails?.productId),
          companyId: companyId,
        },
        
      );
      if (!productDetails) {
        return res.json(sendErrorResponse("productDetails not found"));
      }
      let previousCart = await Cart.findOne({
        productId: cartDetails?.productId,
        userId: id,
      }).lean();

      let cart = await Cart.updateOne(
        { productId: cartDetails?.productId, userId: id },
        {
          userId: id,
          name: productDetails?.name,
          sku: productDetails?.sku,
          ...cartDetails,
          quantity : (previousCart?.quantity || 0) + (cartDetails?.quantity || 0)
        },
        { upsert: true }
      );

      if (cart?.ok) {
        return res.json(
          sendSuccessResponse({
            message: "cart updated",
            details: {
              userId: id,
              ...cartDetails,
              quantity:
                (previousCart?.quantity || 0) + (cartDetails?.quantity || 0),
            },
          })
        );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCartAll(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { id } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let cart = await Cart.deleteMany({
        userId: id,
      });

      if (cart?.ok) {
        return res.json(
          sendSuccessResponse({
            message: "items deleted",
          })
        );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCart(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let productIds = req.body.productIds as string[];
      let { id } = req.user as { companyId: string; id: string };

      if (!productIds || !productIds?.length) {
        return res.json(sendErrorResponse("productIds needed"));
      }

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }

      let cart = await Cart.deleteMany({
        productId: { $in: productIds },
        userId: id,
      });

      if (cart?.ok) {
        return res.json(
          sendSuccessResponse({
            message: "items deleted",
          })
        );
      }
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
}
export default ProfileController;
