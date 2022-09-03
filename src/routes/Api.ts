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
import CommonController from "../controllers/Api/common/index";
import ProductController from "../controllers/Api/products/index";
import AuthRefreshController from "../controllers/Api/Auth/RefreshToken";


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

router.post(
  "/login",
  //   passport.authenticate("jwt", { session: false }),
  AccountUserController.login
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
  "/product",
  passport.authenticate("jwt", { session: false }),
  ProductController.getId
);

router.delete(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.delete
);



export default router;
