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

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

export const statusMap = {
  "in stock": 1,
  "low stock": 2,
  "out of stock": 3,
  closed: 4,
};

class Products {
  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      let searchTerm = req.query.searchTerm as string;
      let { companyId } = req.user as { companyId: string };
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

      if (limit) {
        limit = parseInt(limit.toString());
      }

      if (offset) {
        offset = parseInt(offset.toString());
      }
      let mongoQuery = { companyId } as any;

      if (status) {
        let statusTypes = status.split(",");
        mongoQuery["status"] = { $in: statusTypes };
      }
      if (searchTerm) {
        mongoQuery["$or"] = [
          { sku: new RegExp(searchTerm, "i") },
          { name: new RegExp(searchTerm, "i") },
        ];
      }

      let products = await Product.find(mongoQuery)
        .sort([[sortBy, sortType === "asc" ? 1 : -1]])
        .skip(offset)
        .limit(limit)
        .lean();
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
      return res.json(
        sendSuccessResponse({
          totalCount,
          currentPage: offset / limit + 1,
          products,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getIdPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let productId = req.params.productId;
      let { companyId } = req.user as { companyId: string };

      if (!productId) {
        return res.json(sendErrorResponse("product not found", 1002));
      }
      let mongoQuery = { companyId } as any;

      if (productId) {
        mongoQuery["_id"] = productId;
      }

      let posts = (await Product.findOne(mongoQuery).populate("posts"))?.posts;

      let metrics = posts.map((it) => ({
        id: it._id,
        engagement: faker.datatype.number({ max: 300 }),
        impressions: faker.datatype.number({ max: 300 }),
        reach: faker.datatype.number({ max: 300 }),
        saved: faker.datatype.number({ max: 300 }),
        video_views: faker.datatype.number({ max: 300 }),
        comments_count: faker.datatype.number({ max: 300 }),
        like_count: faker.datatype.number({ max: 300 }),
      }));

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
      if (!posts) {
        return res
          .status(400)
          .json(sendErrorResponse("no product found", 1002));
      }
      return res.json(
        sendSuccessResponse({
          posts,
          metrics,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getId(req: Request, res: Response, next: NextFunction) {
    try {
      let productId = req.params.productId;
      let { companyId } = req.user as { companyId: string };

      if (!productId) {
        return res.json(sendErrorResponse("product not found", 1002));
      }
      let mongoQuery = { companyId } as any;

      if (productId) {
        mongoQuery["_id"] = productId;
      }

      let product = await Product.findOne(mongoQuery).populate("posts");

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
      if (!product) {
        return res
          .status(400)
          .json(sendErrorResponse("no product found", 1002));
      }
      return res.json(
        sendSuccessResponse({
          product,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getSKU(req: Request, res: Response, next: NextFunction) {
    try {
      let skuId = req.params.skuId;
      let { companyId } = req.user as { companyId: string };

      if (!skuId) {
        return res.json(sendErrorResponse("product not found", 1002));
      }
      let mongoQuery = { companyId } as any;

      if (skuId) {
        mongoQuery["sku"] = skuId;
      }

      let product = await Product.findOne(mongoQuery).populate("posts");

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
      if (!product) {
        return res
          .status(400)
          .json(sendErrorResponse("no product found", 1002));
      }
      return res.json(
        sendSuccessResponse({
          product,
        })
      );
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
        return res.json(sendErrorResponse("product not array / empty"));
      }

      let products = await Product.insertMany(productArr);

      return res.json(sendSuccessResponse(products));
    } catch (error) {
      next(error);
    }
  }

  public static async bulkUpload(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let file = req.file;
      let { companyId } = req.user as { companyId: string };
      let fileUrl = (await uploadImage(file, companyId)) as string;

      if (!fileUrl) {
        return res.json(sendErrorResponse("no file found / error in upload"));
      }
      const options: AxiosRequestConfig = {
        url: fileUrl,
        method: "GET",
        responseType: "arraybuffer",
      };
      let axiosResponse = await axios(options);
      const workbook = XLSX.read(axiosResponse.data);

      let worksheets = workbook.SheetNames.map((sheetName) => {
        return {
          sheetName,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]),
        };
      });

      if (
        worksheets[0].data.length === 1 &&
        Object.values(worksheets[0].data[0] as Record<string, unknown>).every(
          (x) => x === null || x === ""
        )
      ) {
        return res.json(sendSuccessResponse([]));
      }
      let errorRows = [];
      let finalData = worksheets[0].data
        .filter((it: any) => {
          if (!it.sku) {
            errorRows.push(it);
            return false;
          }

          if (
            !typeCheckService.isText(it.sku) ||
            !typeCheckService.isText(it.name)
          ) {
            if (
              !typeCheckService.isText(it?.sku?.toString()) &&
              !typeCheckService.isText(it?.name?.toString())
            ) {
              errorRows.push(it);
              return false;
            }
          }

          return true;
        })
        .map((it: any) => {
          if (it.carouselImages instanceof String) {
            it.carouselImages = it.carouselImages
              ?.split(",")
              .filter((kt) => typeCheckService.isValidHttpUrl(kt));
          }

          if (it.thumbnail && !typeCheckService.isValidHttpUrl(it.thumbnail)) {
            it.thumbnail = null;
          }

          if (!typeCheckService.isText(it.name)) {
            it.name = it.name.toString();
          }

          if (!typeCheckService.isText(it.sku)) {
            it.sku = it.sku.toString();
          }
          if (it.status) {
            it.status = statusMap[it.status] || 1;
          }

          return it;
        });

      let productArr = finalData.map((it) => ({
        sku: typeCheckService.isText(it["sku"]),
        name: typeCheckService.isText(it["name"]),
        price: typeCheckService.isNumber(it["price"]) || 0,
        status: it["status"] || 1,
        quantity: typeCheckService.isNumber(it["quantity"]) || 0,
        addedDate: typeCheckService.isDate(it["addedDate"])
          ? new Date(typeCheckService.isDate(it["addedDate"]) as string)
          : new Date(),
        thumbnail: it["thumbnail"],
        category: it["category"],
        carouselImages: it["carouselImages"] || [],
      })) as IProducts[];

      let productArrInsert = productArr
        ?.filter((it) => it.sku)
        ?.map((it) => ({
          updateOne: {
            filter: { sku: it.sku, companyId: new ObjectId(companyId) },
            update: {
              ...it,

              companyId: new ObjectId(companyId),
            },
            upsert: true,
          },
        }));

      if (!productArr || !productArr.length) {
        return res.json(sendErrorResponse("product not array / empty"));
      }

      await Product.bulkWrite(productArrInsert);

      return res.json(
        sendSuccessResponse({
          productsUploaded: productArr?.length,
          errorCount: errorRows?.length || 0,
        })
      );
    } catch (error) {
      console.log(error);
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
        return res.json(sendErrorResponse("product not array / empty"));
      }

      let products = await Promise.all(
        productArr.map(async (it) => {
          let _id = it?._id;

          if (!_id) return { update: false, _id };
          delete it?._id;

          let update = await Product.updateOne(
            { _id: _id },
            { ...it },
            {
              upsert: true,
            }
          );

          return { update: !!update.ok, _id: _id };
        })
      );

      return res.json(sendSuccessResponse(products));
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      let productArr = req.body.products as string[];
      let { companyId } = req.user as { companyId: string };

      if (!productArr || !productArr.length) {
        return res.json(sendErrorResponse("product not array / empty"));
      }

      let products = await Product.deleteMany({
        _id: { $in: productArr },
        companyId,
      });

      return res.json(
        sendSuccessResponse({ deletedCount: products?.deletedCount || 0 })
      );
    } catch (error) {
      next(error);
    }
  }
}

export default Products;
