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

interface LoginGetI extends IAccountUser, IAccessToken {}
class AccountUserAuth {
  public static async login(req: Request, res: Response, next) {
    try {
      let body = req.body as LoginGetI;

      const _email = body.email.toLowerCase();

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
          let accountSaveStatus = await saveAccountUser(
            accountuserData,
            _email,
            body
          );

           let accessTokenStatus;
          if(accountSaveStatus)
         {
            accessTokenStatus = await saveAccessToken(
             body,
             accountSaveStatus as string
           );
         }

          const token = jwt.sign({ email: _email }, Locals.config().appSecret, {
            expiresIn: (60 * 60) * 30,
          });

          if (accessTokenStatus?.ok && accountSaveStatus) {
            return res.json({
              status: true,
              userId: body.userID,
              token,
              token_expires_in: (60 * 60) * 30,
              accountSaveStatus,
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
}

export default AccountUserAuth;


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
  _email: string,
  body: LoginGetI
) {
  let accountSaveStatus;
  if (accountuserData) {
    accountSaveStatus = await AccountUser.updateOne({ email: _email }, body, {
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
