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

// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectId } from "mongodb";
import axios from "axios";
import Company from "../../../models/company";
import Product from "../../../models/products";
import { IProducts } from "../../../interfaces/models/products";

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

class Products {
  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      
      let searchTerm = req.query.searchTerm as string;
      let {
        limit = 10,
        offset = 0,
        sortBy = "addedDate",
        sortType = "asc",
        status,
      } = req.query as unknown as {
        limit: number;
        offset: number;
        sortBy: string;
        sortType: string;
        status: string;
      };

      if(limit){
        limit = parseInt(limit.toString())
      }

       if (offset) {
         offset = parseInt(offset.toString());
       }
      let mongoQuery = { } as any;

       if(status){
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
       }
      if(searchTerm){
        mongoQuery["$or"] = [
          { sku: new RegExp(searchTerm, "i") },
          { name: new RegExp(searchTerm, "i") },
        ]; 
      }

      let products = await Product.find(mongoQuery).sort([[sortBy,sortType === 'asc' ? 1 : -1]]).skip(offset).limit(limit).lean();
      let totalCount = await Product.find(mongoQuery).count();

      //  let products1 = await Promise.all(
      //    products.map(async (it) => {
      //      let _id = it?._id;

      //      if (!_id) return { update: false, _id };
      //      delete it?._id;

      //      let update = await Product.updateOne(
      //        { _id: _id },
      //        { status: [1, 2, 3, 4][getRandomIntInclusive(0, 3)] },
      //        {
      //          upsert: true,
      //        }
      //      );

      //      return { update: !!update.ok, _id: _id };
      //    })
      //  );
      return res.json({
        totalCount,
        currentPage: offset / limit + 1,
        products,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async post(req: Request, res: Response, next: NextFunction) {
    try {
      let productArr = req.body.products as IProducts[];
      let { companyId } = req.user as { companyId: string };

      productArr = productArr
        ?.filter((it) => it.sku)
        ?.map((it) => ({
          ...it,

          companyId: new ObjectId(companyId),
        }));

      if (!productArr || !productArr.length) {
        return res.json({ error: "product not array / empty" });
      }

      let products = await Product.insertMany(productArr);

      return res.json(products);
    } catch (error) {
      next(error);
    }
  }

  public static async patch(req: Request, res: Response, next: NextFunction) {
    try {
      let productArr = req.body.products as IProducts[];
      let { companyId } = req.user as { companyId: string };

      productArr = productArr
        ?.filter((it) => it.sku && it?._id)
        ?.map((it) => ({
          ...it,

          companyId: new ObjectId(companyId),
        }));

      if (!productArr || !productArr.length) {
        return res.json({ error: "product not array / empty" });
      }

      let products = await Promise.all(
        productArr.map(async (it) => {
          let _id = it?._id;

          if (!_id) return { update: false, _id };
          delete it?._id;

          let update = await Product.updateOne(
            { _id: _id },
            { it },
            {
              upsert: true,
            }
          );

          return { update: !!update.ok, _id: _id };
        })
      );

      return res.json(products);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      let productArr = req.body.products as string[];
      let { companyId } = req.user as { companyId: string };

   
      if (!productArr || !productArr.length) {
        return res.json({ error: "product not array / empty" });
      }

      let products = await Product.deleteMany({
        _id: { $in: productArr },
        companyId,
      });

      return res.json({ deletedCount: products?.deletedCount || 0 });
    } catch (error) {
      next(error);
    }
  }
}

export default Products;
