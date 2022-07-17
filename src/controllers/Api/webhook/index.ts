/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { IComment } from "../../../interfaces/models/commets";
import { IWebhook } from "../../../interfaces/webhook/post";

import Comment from "../../../models/comment";

class AccountUserAuth {
  public static async get(req: Request, res: Response, next) {
    try {
      // console.log(req.body, req.query, req.method);
      return res.send(req.query["hub.challenge"]);
    } catch (error) {
      next(error);
    }
  }

  public static async post(req: Request, res: Response, next) {
    try {
      let webhookValue = req.body as IWebhook;

      if(webhookValue.object === 'instagram'){
          webhookValue.entry.map(it => {
            it.changes.map(async changeType => {
              let commentId:string;
              switch (changeType.field) {
                case "comments":
                  let comment = await new Comment({ ...changeType.value,meta : {time : it.time, id : it.id} }).save();
                  if(comment?._id){
                    commentId = comment._id
                  }
                  break;
              
                default:
                  break;
              }
            })
          })
      }
      return res.send(req.query["hub.challenge"]);
    } catch (error) {
      next(error);
    }
  }
}

export default AccountUserAuth;
