/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { ICommentBot } from "../../../interfaces/models/commentbot";
import CommentBot from "../../../models/commentbot";

class AccountUserAuth {
  public static async get(req: Request, res: Response, next) {
    try {
      const { limit = 10, skip = 0, ...query } = req.query;

      let comments = await CommentBot.find({
        ...query,
        accountUserId: new ObjectId((req.user as any)._id),
      })
        .limit(limit as number)
        .skip(skip as number)
        .lean();

      console.log(comments);

      return res.json({
        status: true,

        comments,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async post(req: Request, res: Response, next) {
    try {
      let comment = req.body as ICommentBot;

      comment.accountUserId = new ObjectId((req.user as any)._id);
      let commentSave = await new CommentBot({
        ...comment,
      }).save();

      if (!commentSave?._id) {
        return res.json({ status: false, error: "not added" });
      }

      return res.json({
        status: true,
        commentId: commentSave?.id,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async patch(req: Request, res: Response, next) {
    try {
      let comment = req.body as ICommentBot;
      let commentId = req.params.id;

      if (!commentId) {
        return res.json({ error: "no comment Id" });
      }

      let commentSave = await CommentBot.updateOne(
        { _id: new ObjectId(commentId) },
        {
          ...comment,
        },
        { upsert: true }
      );

      if (!commentSave?.ok) {
        return res.json({ status: false, error: "not updatednpm run" });
      }

      return res.json({
        status: true,
        commentId: commentId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next) {
    try {
      let commentId = req.params.id;

      if (!commentId) {
        return res.json({ error: "no comment Id" });
      }

      let commentSave = await CommentBot.deleteOne({
        _id: new ObjectId(commentId),
      });

      if (!commentSave?.ok) {
        return res.json({ status: false, error: "not deleted" });
      }

      return res.json({
        status: true,
        commentId: commentId,
        
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AccountUserAuth;
