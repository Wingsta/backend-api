/**
 * Define all your API web-routes
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import { Router } from "express";
import * as expressJwt from "express-jwt";
import * as passport from "passport";
import Locals from "../providers/Locals";

import AccountUserController from "../controllers/Api/AccountUserAuth";
import CommentbotController from "../controllers/Api/commentbot";
import NotificationbotController from "../controllers/Api/notificationbot";
import CommentController from "../controllers/Api/comments";
import WebhookController from "../controllers/Api/webhook";
import RefreshTokenController from "../controllers/Api/Auth/RefreshToken";

const router = Router();

router.post(
  "/getToken",
  //   passport.authenticate("jwt", { session: false }),
  AccountUserController.login
);

router.post(
  "/getTestToken",
  //   passport.authenticate("jwt", { session: false }),
  AccountUserController.testLogin
);

router.post(
  "/auth/refresh-token",
  expressJwt({ secret: Locals.config().appSecret }),
  RefreshTokenController.perform
);

/**
 * Comment Bot
 */
router.get(
  "/commentbot",
  passport.authenticate("jwt", { session: false }),
  CommentbotController.get
);


router.get(
  "/commentbot/:id",
  passport.authenticate("jwt", { session: false }),
  CommentbotController.getId,

  CommentController.getAll
);



router.post(
  "/commentbot",
  passport.authenticate("jwt", { session: false }),
  CommentbotController.post
);

router.patch(
  "/commentbot/:id",
  passport.authenticate("jwt", { session: false }),
  CommentbotController.patch
);

router.delete(
  "/commentbot/:id",
  passport.authenticate("jwt", { session: false }),
  CommentbotController.delete
);


/**
 * Notification Bot
 */
router.get(
  "/notificationbot",
  passport.authenticate("jwt", { session: false }),
  NotificationbotController.get
);


router.get(
  "/notificationbot/:id",
  passport.authenticate("jwt", { session: false }),
  NotificationbotController.getId,
  CommentController.getAll
);



router.post(
  "/notificationbot",
  passport.authenticate("jwt", { session: false }),
  NotificationbotController.post
);

router.patch(
  "/notificationbot/:id",
  passport.authenticate("jwt", { session: false }),
  NotificationbotController.patch
);

router.delete(
  "/notificationbot/:id",
  passport.authenticate("jwt", { session: false }),
  NotificationbotController.delete
);



/**
 * Comments
 * 
 */
router.get(
  "/comments/:id",
  passport.authenticate("jwt", { session: false }),
  CommentController.get
);



router.get(
  "/webhook",

  WebhookController.get
);

router.post(
  "/webhook",

  WebhookController.post
);

export default router;
