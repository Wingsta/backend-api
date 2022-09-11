/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";
import AccountUser from "../../../models/accountuser";
import { IAccountUser, ICompany } from "../../../interfaces/models/accountuser";
import * as bcrypt from "bcryptjs";

// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectID, ObjectId } from "mongodb";
import axios from "axios";
import Company from "../../../models/company";
import {
  sendErrorResponse,
  sendResponse,
  sendSuccessResponse,
} from "../../../services/response/sendresponse";
import Product from "../../../models/products";

interface ISignupGet extends IAccountUser, ICompany {}

const generateHash = async (plainPassword: string) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = await bcrypt.hashSync(plainPassword, salt);
  return hash;
};
class AccountUserAuth {
  public static async login(req: Request, res: Response, next) {
    try {
      let body = req.body as { [key: string]: any } & {
        userID: string;
        accessToken: string;
      };
      let { companyId } = req.user as { companyId: string };

      if (!body.userID) {
        return res.json(sendErrorResponse("no userId"));
      }

      if (!body.accessToken) {
        return res.json({ error: "no accessToken" });
      }

      let data = await saveBuisnessAccount(body.userID, body.accessToken);

      let meta = {
        ...data,
      };

      if (companyId) {
        await Company.updateOne(
          { _id: new ObjectId(companyId) },
          { $set: { meta: meta } },
          { upsert: true }
        );
      }

      return res.json(sendSuccessResponse(meta));
    } catch (error) {
      next(error);
    }
  }

  public static async createPost(req: Request, res: Response, next) {
    try {
      let { companyId } = req.user as { companyId: string };
      let { image_url, caption, productId,name } = req.body as {
        image_url: string;
        caption: string;
        productId: string;
		name : string;
      };
      if (!companyId) {
        return res.json(sendErrorResponse("no companyId"));
      }

      let company = await Company.findOne({ _id: new ObjectID(companyId) });

      if (company.meta) {
        let data = await savePost(
          company?.meta?.buisnessAccountId,
          company?.meta?.accessToken,
          image_url,
          caption
        );

        if (data?.data?.id) {
          let object = [
            {
              id: data?.data?.id,
              image_url,
              caption,
              createdTime: new Date(),
			  name
            },
          ];

          let k = await Product.updateOne(
            { _id: new ObjectId(productId) },
            { $push: { posts: object } },
            { upsert: true }
          );
          console.log(k);
        }
        return res.json(sendSuccessResponse(data?.data));
      }
    } catch (error) {
      next(error);
    }
  }

  public static async createCarousel(req: Request, res: Response, next) {
    try {
      let { companyId } = req.user as { companyId: string };
      let { image_url, caption, productIds ,name} = req.body as {
        image_url: string[];
        caption: string;
        productIds: string[];
		name : string;
      };
      if (!companyId) {
        return res.json(sendErrorResponse("no companyId"));
      }

      let company = await Company.findOne({ _id: new ObjectID(companyId) });

      if (company.meta) {
        let data = await saveCarousel(
          company?.meta?.buisnessAccountId,
          company?.meta?.accessToken,
          image_url,
          caption
        );

        if (data?.data?.id) {
          let object = [
            {
              id: data?.data?.id,
			  media_type : "CAROUSEL",
              image_url,
              caption,
              createdTime: new Date(),
			  name
            },
          ];

          let k = await Product.updateMany(
            { _id: productIds.map((productId) => new ObjectId(productId)) },
            { $push: { posts: object } },
            { upsert: true }
          );
          console.log(k);
        }
        return res.json(sendSuccessResponse(data?.data));
      }
    } catch (error) {
      next(error);
    }
  }
}

async function saveBuisnessAccount(userID: string, accessToken: string) {
  try {
    //get facebook accounts for that user
    const response = await axios.get(
      `https://graph.facebook.com/v14.0/${userID}?fields=accounts&access_token=${accessToken}`
    );

    if (response?.data?.accounts?.data[0]) {
      let account = response?.data?.accounts?.data[0];

      //      "https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&
      // client_id=APP-ID&
      // client_secret=APP-SECRET&
      // fb_exchange_token=SHORT-LIVED-USER-ACCESS-TOKEN"
      if (account?.id) {
        //get facebook page token for that user
        const pageToken = await axios.get(
          `https://graph.facebook.com/${account?.id}?fields=access_token&access_token=${accessToken}`
        );

        const buisnessAccount = await axios.get(
          `https://graph.facebook.com/v14.0/${account?.id}?fields=instagram_business_account&access_token=${accessToken}`
        );

        if (pageToken?.data?.access_token) {
          const commentSubscription = await axios.post(
            `https://graph.facebook.com/v14.0/${account?.id}/subscribed_apps?subscribed_fields=mention&access_token=${pageToken?.data?.access_token}`
          );
        }

        if (buisnessAccount?.data?.instagram_business_account?.id) {
          let ig = buisnessAccount?.data?.instagram_business_account?.id;
          const buisnessAccountIG = await axios.get(
            `https://graph.facebook.com/v14.0/${ig}?fields=id,name,profile_picture_url,username&access_token=${accessToken}`
          );

          const subscriptions = await axios.get(
            `https://graph.facebook.com/v14.0/${account?.id}/subscribed_apps?access_token=${pageToken?.data?.access_token}`
          );

          if (buisnessAccountIG?.data) {
            return {
              buisnessAccountData: buisnessAccountIG?.data,
              buisnessAccountId:
                buisnessAccount?.data?.instagram_business_account?.id,
              fbPageId: account?.id,
              subscriptions: subscriptions?.data,
              fbPageAccessToken: pageToken?.data?.access_token,
              accessToken,
            };
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function savePost(
  buisnessAccountId: string,
  accessToken: string,
  image_url: string = "https://via.placeholder.com/200x250",
  caption: string = "vishal"
) {
  try {
    //get facebook accounts for that user
    // `https://graph.facebook.com/v14.0/${buisnessAccountId}/media?access_token=${accessToken}&image_url=https://via.placeholder.com/200x250&caption=%23BronzFonz`;
    const buisnessAccountIG = await axios.post(
      `https://graph.facebook.com/v14.0/${buisnessAccountId}/media?access_token=${accessToken}&image_url=${image_url}&caption=${caption}`
    );

    if (buisnessAccountIG?.data) {
      let id = buisnessAccountIG?.data?.id;

      const publish = await axios.post(
        `https://graph.facebook.com/v14.0/${buisnessAccountId}/media_publish?creation_id=${id}&access_token=${accessToken}`
      );

      console.log(publish);
      return publish;
    }
    if (buisnessAccountIG) {
      return null;
    }
  } catch (error) {
    console.error(error);
  }
}

async function saveCarousel(
  buisnessAccountId: string,
  accessToken: string,
  image_urls: string[] = ["https://via.placeholder.com/200x250"],
  caption: string = "vishal"
) {
  try {
    //get facebook accounts for that user
    // `https://graph.facebook.com/v14.0/${buisnessAccountId}/media?access_token=${accessToken}&image_url=https://via.placeholder.com/200x250&caption=%23BronzFonz`;
    if (!image_urls || !image_urls.length) {
      return null;
    }

    const containers = (
      await Promise.all(
        image_urls.map(async (image_url) => {
          let container = await axios.post(
            `https://graph.facebook.com/v14.0/${buisnessAccountId}/media?access_token=${accessToken}&image_url=${image_url}&caption=${caption}&is_carousel_item=true`
          );

          return container?.data?.id;
        })
      )
    ).filter((it) => !!it);
    if (containers?.length) {
      const carouselContainer = await axios.post(
        `https://graph.facebook.com/v14.0/${buisnessAccountId}/media?access_token=${accessToken}&children=${containers.join(
          ","
        )}&caption=${caption}&media_type=CAROUSEL`
      );

      console.log(carouselContainer);

      if (carouselContainer?.data) {
        let id = carouselContainer?.data?.id;

        const publish = await axios.post(
          `https://graph.facebook.com/v14.0/${buisnessAccountId}/media_publish?creation_id=${id}&access_token=${accessToken}`
        );

        console.log(publish);
        return publish;
      }
    }
    return null;
  } catch (error) {
    console.error(error);
  }
}

export default AccountUserAuth;
