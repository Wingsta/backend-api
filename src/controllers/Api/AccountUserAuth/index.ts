/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";
import AccountUser from "../../../models/accountuser";
import {
  IAccountUser,
  IAccessToken,
} from "../../../interfaces/models/accountuser";
import AccessToken from "../../../models/token";
// import { Types  } from "mongoose";
import Locals from "../../../providers/Locals";
import { ObjectId } from "mongodb";
import axios from "axios";

interface LoginGetI extends IAccountUser, IAccessToken {}
class AccountUserAuth {
  public static async login(req: Request, res: Response, next) {
    try {
      let body = req.body as LoginGetI;

      const userID = body.userID;

      if (!userID) {
        return res.json({ error: "no userID" });
      }

      AccountUser.findOne(
        { userID: userID },
        async (err: Error, accountuserData: IAccountUser) => {
          if (err) {
            return res.json({
              error: err,
            });
          }
          let data = await saveBuisnessAccount(userID, body.accessToken)

          body.meta = {
            ...data
          }
          let accountSaveStatus = await saveAccountUser(
            accountuserData,
            userID,
            body
          );

          let accessTokenStatus;
          if (accountSaveStatus) {
            accessTokenStatus = await saveAccessToken(
              body,
              accountSaveStatus as string
            );
          }

          const token = jwt.sign(
            { email: body.email, name: body.name, userID: body.userID },
            Locals.config().appSecret,
            {
              expiresIn: 60 * 60 * 30,
            }
          );

          if (accessTokenStatus?.ok && accountSaveStatus) {
            return res.json({
              status: true,
              userId: body.userID,
              token,
              token_expires_in: 60 * 60 * 30,
              accountSaveStatus,
              meta: data,
            });
          } else {
            return res.json({
              status: false,
              accountSaveStatus,
              accessTokenStatus,
            });
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }

  public static async testLogin(req: Request, res: Response, next) {
    try {
      let body = req.body as LoginGetI;

      const _email = body?.email?.toLowerCase();

      if (!_email) {
        return res.json({ error: "no email" });
      }

      AccountUser.findOne(
        { email: _email },
        async (err: Error, accountuserData: IAccountUser) => {
          if (err) {
            return res.json({
              error: err,
            });
          }
         
          const token = jwt.sign(
            {
              email: _email,
              name: accountuserData.name,
              userID: accountuserData.userID,
            },
            Locals.config().appSecret,
            {
              expiresIn: 60 * 60 * 30,
            }
          );

          if (accountuserData) {
            return res.json({
              status: true,
              userId: accountuserData.userID,
              token,
              token_expires_in: 60 * 60 * 30,
            });
          } else {
            return res.json({
              status: false,
            });
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

export default AccountUserAuth;

async function saveBuisnessAccount(userID: string, accessToken: string) {
  try {

    //get facebook accounts for that user
    const response = await axios.get(
      `https://graph.facebook.com/v14.0/${userID}?fields=accounts&access_token=${accessToken}`
    );

    if (response?.data?.accounts?.data[0]) {
      let account = response?.data?.accounts?.data[0];
console.log(account);
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
              buisnessAccountId: buisnessAccount?.data?.id,
              fbPageId: account?.id,
              subscriptions: subscriptions?.data,
              fbPageAccessToken: pageToken?.data?.access_token,
            };
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function saveAccessToken(body: LoginGetI,_id:string) {
  return await AccessToken.updateOne(
    { accountUserId: new ObjectId(_id) },
    {...body,_id},
    {
      upsert: true,
    }
  );
}

async function saveAccountUser(
  accountuserData: IAccountUser,
  userID: string,
  body: LoginGetI
) {
  
  let accountSaveStatus;
  if (accountuserData) {

    accountSaveStatus = await AccountUser.updateOne({ userID: userID }, {...body}, {
      upsert: true,
    });
  }

  if (!accountuserData && body) {
   
    let newAccountUser = new AccountUser(body);

    accountSaveStatus = await newAccountUser.save();
  }

  if (accountSaveStatus?._id) {
    return accountSaveStatus._id;
  }

  if (accountuserData?._id) {
    return accountuserData._id;
  }
  return null;
}
