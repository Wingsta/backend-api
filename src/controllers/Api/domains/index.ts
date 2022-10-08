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

class Products {
  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      let name = req.query.name as string;
      let { companyId } = req.user as { companyId: string };

      let company = await Company.findOne({ _id: companyId }).lean();

      if (!company) {
        return res.json(sendErrorResponse("company not found"));
      }
      if (!name) {
        return res.json(sendErrorResponse("name should not be empty"));
      }

      let oldDomain = (await Domain.find({ companyId }).lean())[0];

      if (oldDomain) {
        let meta = company.meta;
        if (!meta) {
          meta = {};
        }
        meta.domainName = oldDomain.name;
        meta.domainId = oldDomain._id;
        let status = await Company.updateOne(
          { _id: company },
          { $set: { meta } },
          { upsert: true }
        );

        if (status.ok) {
          return res.json(
            sendErrorResponse("Domain exists , try again.", null, {
              domain: oldDomain,
            })
          );
        }
      }

      let mongoQuery = { [`meta.domainName`]: name.toLowerCase() } as any;

      let products = await Company.findOne(mongoQuery);

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
          exists: !!products,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  public static async post(req: Request, res: Response, next: NextFunction) {
    try {
      let name = req.body.name as string;
      let { companyId } = req.user as { companyId: string };
      let company = await Company.findOne({ _id: companyId }).lean();

      if (!company) {
        return res.json(sendErrorResponse("company not found"));
      }
      if (!name) {
        return res.json(sendErrorResponse("name should not be empty"));
      }

      let oldDomain = (await Domain.find({ companyId }).lean())[0];

      if (oldDomain) {
        let meta = company.meta;
        if (!meta) {
          meta = {};
        }
        meta.domainName = oldDomain.name;
        meta.domainId = oldDomain._id;
        let status = await Company.updateOne(
          { _id: company },
          { $set: { meta } },
          { upsert: true }
        );

        if (status.ok) {
          return res.json(
            sendErrorResponse("Domain exists , try again.", null, {
              domain: oldDomain,
            })
          );
        }
      }

      let domain = (
        await Domain.insertMany({ name: name.toLowerCase(), companyId })
      )[0];

      if (domain) {
        let meta = company.meta;
        if (!meta) {
          meta = {};
        }
        meta.domainName = name;
        meta.domainId = domain._id;
        let status = await Company.updateOne(
          { _id: company },
          { $set: { meta } },
          { upsert: true }
        );

        if (status.ok) {
          return res.json(
            sendSuccessResponse({
              domainId: domain._id,
              ...meta,
              published: false,
            })
          );
        }
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async patchDomain(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = req.body as IDomain;
      let domainId = req.params.domain;
      let { companyId } = req.user as { companyId: string };

      if (!domain || !domain.metaData) {
        return res.json(sendErrorResponse("not a domain object"));
      }

      console.log(domain,"do")

      let update = await Domain.updateOne(
        { _id: domainId },
        { $set: { metaData: domain.metaData } },
        { upsert: true }
      );

      if (update.ok) return res.json(sendSuccessResponse({ updated: true }));
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async togglePublish(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domain = req.body as IDomain;
      let domainId = req.params.domain;
      let { companyId } = req.user as { companyId: string };

      if (!domain) {
        return res.json(sendErrorResponse("not a domain object"));
      }

      console.log(domain)

      let update = await Domain.updateOne(
        { _id: domainId },
        { $set: { published: !!domain.published } },
        { upsert: true,  }
      );

      if (update.ok) return res.json(sendSuccessResponse({ updated: true }));
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getDomain(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let domainId = req.params.domain;
      let { companyId } = req.user as { companyId: string };

      if (!domainId) {
        return res.json(sendErrorResponse("domainId needed"));
      }

      let domain = await Domain.findOne({ _id: domainId, companyId }).lean();

      if(domain?.metaData?.popularProducts?.length){
        let products = await Product.find({
          companyId,
          _id: { $in: domain?.metaData?.popularProducts },
        }).lean();

        domain.metaData.popularProducts = products;
      }
      if (domain) return res.json(sendSuccessResponse(domain));
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }

  public static async getPublicDomain(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let name = req.params.domain as string;

      if (!name) {
        return res.json(sendErrorResponse("name not found", 1002));
      }

      let mongoQuery = { [`meta.domainName`]: name } as any;

      let company = await Company.findOne(mongoQuery);

      let domainId = company.meta.domainId;

      if (!domainId) {
        return res.json(sendErrorResponse("domainId needed"));
      }

      let domain = await Domain.findOne({ _id: domainId }).lean();

        if (domain?.metaData?.popularProducts?.length) {
          let products = await Product.find({
            companyId: company._id,
            _id: { $in: domain?.metaData?.popularProducts },
          }).lean();

          domain.metaData.popularProducts = products;
        }

      if (domain) return res.json(sendSuccessResponse(domain));
      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
}

export default Products;
