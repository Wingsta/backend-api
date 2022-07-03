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
import CommentController from "../controllers/Api/comment";
import RefreshTokenController from "../controllers/Api/Auth/RefreshToken";

const router = Router();

router.post(
  "/getToken",
  //   passport.authenticate("jwt", { session: false }),
  AccountUserController.login
);

router.post(
  "/auth/refresh-token",
  expressJwt({ secret: Locals.config().appSecret }),
  RefreshTokenController.perform
);

router.get(
  "/comments",
    passport.authenticate("jwt", { session: false }),
  CommentController.get
);

router.post(
  "/comments",
    passport.authenticate("jwt", { session: false }),
  CommentController.post
);

router.patch(
  "/comments/:id",
    passport.authenticate("jwt", { session: false }),
  CommentController.patch
);

router.delete(
  "/comments/:id",
    passport.authenticate("jwt", { session: false }),
  CommentController.delete
);

export default router;
