/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { IComment } from "../../../interfaces/models/commets";
import Comment from "../../../models/comment";

class Commentbot {
  public static async getAll(req: Request, res: Response, next) {
    try {
      const { limit = 10, skip = 0, ...query } = req.query;

      let comments = await Comment.find({
        parent_id: { $exists: false },
        ...query,
      })
        .limit(limit as number)
        .skip(skip as number)
        .lean();

      return res.json({
        status: true,

        comments,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async get(req: Request, res: Response, next) {
    try {
      const { limit = 10, skip = 0, ...query } = req.query;
      const id = req.params.id;

      let comments = await Comment.find({
        $or: [{ id: id }, { parent_id: id }],
        ...query,
      })
        .limit(limit as number)
        .skip(skip as number)
        .sort([["meta.time", 1]])
        .lean();

      return res.json({
        status: true,

        comments,
      });
    } catch (error) {
      next(error);
    }
  }


}

export default Commentbot;
