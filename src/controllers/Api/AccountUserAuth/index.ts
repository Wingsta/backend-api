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
          let accountSaveStatus;
          if (accountuserData) {
            accountSaveStatus = await AccountUser.updateOne(
              { email: _email },
              body,
              {
                upsert: true,
              }
            );
          }

          if (!accountuserData && body) {
            let newAccountUser = await new AccountUser(body);

            accountSaveStatus = newAccountUser.save();
          }

          let accessTokenStatus = await  AccessToken.updateOne({userId : body.userID},body,{upsert: true});

          const token = jwt.sign({ email: _email }, "YOYOYOYOYO", {
            expiresIn: 10 * 600,
          });

          if (accessTokenStatus?.ok && accountSaveStatus?.ok) {
            return res.json({
              status: true,
              userId: body.userID,
              token,
              token_expires_in: 10 * 600,
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
