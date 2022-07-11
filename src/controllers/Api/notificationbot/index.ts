/**
 * Define Login Login for the API
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { INotificationBot } from "../../../interfaces/models/notificationbot";
import NotificationBot from "../../../models/notificationbot";

class NotificationBotC {
  public static async get(req: Request, res: Response, next) {
    try {
      const { limit = 10, skip = 0, ...query } = req.query;

      let notifications = await NotificationBot.find({
        ...query,
        accountUserId: new ObjectId((req.user as any)._id),
      })
        .limit(limit as number)
        .skip(skip as number)
        .lean();

      

      return res.json({
        status: true,

        notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async post(req: Request, res: Response, next) {
    try {
      let notification = req.body as INotificationBot;

      notification.accountUserId = new ObjectId((req.user as any)._id);
      let notificationSave = await new NotificationBot({
        ...notification,
      }).save();

      if (!notificationSave?._id) {
        return res.json({ status: false, error: "not added" });
      }

      return res.json({
        status: true,
        notificationId: notificationSave?._id,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async patch(req: Request, res: Response, next) {
    try {
      let notification = req.body as INotificationBot;
      let notificationId = req.params.id;

      if (!notificationId) {
        return res.json({ error: "no notification Id" });
      }

      let notificationSave = await NotificationBot.updateOne(
        { _id: new ObjectId(notificationId) },
        {
          ...notification,
        },
        { upsert: true }
      );

      if (!notificationSave?.ok) {
        return res.json({ status: false, error: "not updatednpm run" });
      }

      return res.json({
        status: true,
        notificationId: notificationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next) {
    try {
      let notificationId = req.params.id;

      if (!notificationId) {
        return res.json({ error: "no comment Id" });
      }

      let notificationSave = await NotificationBot.deleteOne({
        _id: new ObjectId(notificationId),
      });

      if (!notificationSave?.ok) {
        return res.json({ status: false, error: "not deleted" });
      }

      return res.json({
        status: true,
        notificationId: notificationId,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationBotC;
