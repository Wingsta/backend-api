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
import InstaAuthController from "../controllers/Api/instaauth";
import CommonController from "../controllers/Api/common/index";
import ProductController from "../controllers/Api/products/index";
import AuthRefreshController from "../controllers/Api/Auth/RefreshToken";
import DomainController from "../controllers/Api/domains/index";

const router = Router();

router.post(
  "/upload",
  passport.authenticate("jwt", { session: false }),
  CommonController.upload
);

router.post(
  "/bulkupload",
  passport.authenticate("jwt", { session: false }),
  ProductController.bulkUpload
);

router.post(
  "/signup",
  //   passport.authenticate("jwt", { session: false }),
  AccountUserController.signup
);

console.log("hello");
router.post(
  "/login",
  //   passport.authenticate("jwt", { session: false }),
  AccountUserController.login
);

router.post(
  "/insta/login",
  passport.authenticate("jwt", { session: false }),
  InstaAuthController.login
);

router.get(
  "/insta/post",
  passport.authenticate("jwt", { session: false }),
  InstaAuthController.get
);

router.post(
  "/insta/carousel",
  passport.authenticate("jwt", { session: false }),
  InstaAuthController.createCarousel
);

router.get(
  "/insta/post/:postId",
  passport.authenticate("jwt", { session: false }),
  InstaAuthController.login
);

router.delete(
  "/insta/post/:postId",
  passport.authenticate("jwt", { session: false }),
  InstaAuthController.login
);

router.patch(
  "/insta/post/:postId",
  passport.authenticate("jwt", { session: false }),
  InstaAuthController.login
);

router.get(
  "/refreshToken",
  passport.authenticate("jwt", { session: false }),
  AuthRefreshController.perform
);

router.post(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.post
);

router.patch(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.patch
);

router.get(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.get
);

router.get(
  "/product/:productId/analytics",
  passport.authenticate("jwt", { session: false }),
  ProductController.getIdPosts
);

router.get(
  "/product/:productId",
  passport.authenticate("jwt", { session: false }),
  ProductController.getId
);

router.delete(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.delete
);

router.post(
  "/domain/",
  passport.authenticate("jwt", { session: false }),
  DomainController.post
);

router.get(
  "/domain/exists",
  passport.authenticate("jwt", { session: false }),
  DomainController.get
);

router.get(
  "/domain/:domain",
  passport.authenticate("jwt", { session: false }),
  DomainController.getDomain
);

router.post(
  "/domain/:domain",
  passport.authenticate("jwt", { session: false }),
  DomainController.patchDomain
);

router.get(
  "/public/domain/:domain",

  DomainController.getPublicDomain
);

export default router;
