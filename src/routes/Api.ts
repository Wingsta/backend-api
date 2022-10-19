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
import ProfileController from "../controllers/Api/profile/index";
import CartController from "../controllers/Api/cart/index";
import OrderController from "../controllers/Api/orders/index";
import AdminOrderController from "../controllers/Api/admin-orders/index";

const router = Router();

router.post(
  "/upload",
  passport.authenticate("jwt", { session: false }),
  CommonController.upload
);

router.post(
  "/uploadForSocialLink",
  passport.authenticate("jwt", { session: false }),
  CommonController.uploadForSocialLink
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

router.get(
  "/product/sku/:skuId",
  passport.authenticate("jwt", { session: false }),
  ProductController.getSKU
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
  DomainController.getDomainMiddleWare,
  DomainController.getDomain
);

router.post(
  "/domain/toggle-publish/:domain",
  passport.authenticate("jwt", { session: false }),
  DomainController.togglePublish
);

router.post(
  "/domain/:domain/meta",
  passport.authenticate("jwt", { session: false }),
  DomainController.patchDomainMeta
);

router.post(
  "/domain/:domain",
  passport.authenticate("jwt", { session: false }),
  DomainController.patchDomain
);

// admin orders

router.get(
  "/order/",
  passport.authenticate("jwt", { session: false }),

  AdminOrderController.getOrders
);

router.post(
  "/order/updateStatus/:orderId",
  passport.authenticate("jwt", { session: false }),

  AdminOrderController.statusUpdate
);

/// profile 


router.get(
  "/public/domain/:domain/profile",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  ProfileController.getProfile
);

router.post(
  "/public/domain/:domain/verifyProfile/:mobile",
  DomainController.getPublicDomainMiddleWare,
  ProfileController.verifyProfile
);

router.post(
  "/public/domain/:domain/profile",
  DomainController.getPublicDomainMiddleWare,
  ProfileController.postProfile
);

router.patch(
  "/public/domain/:domain/profile",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  ProfileController.patchProfile
);

//// cart 

router.get(
  "/public/domain/:domain/cart/",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  CartController.getCart
);

router.get(
  "/public/domain/:domain/cart/count",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  CartController.getCartCount
);

router.post(
  "/public/domain/:domain/sendToCart",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  CartController.postCart
);

router.delete(
  "/public/domain/:domain/deleteCartAll",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  CartController.deleteCartAll
);

router.delete(
  "/public/domain/:domain/deleteCart",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  CartController.deleteCart
);


//// order

router.get(
  "/public/domain/:domain/order/count",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  OrderController.getOrders
);

router.get(
  "/public/domain/:domain/order/",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  OrderController.getOrders
);



router.post(
  "/public/domain/:domain/placeOrder",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  OrderController.postOrder
);

router.post(
  "/public/domain/:domain/updateStatus/:orderId",
  passport.authenticate("profile", { session: false }),
  DomainController.getPublicDomainMiddleWare,
  OrderController.statusUpdate
);

// router.patch(
//   "/public/domain/:domain/deleteCartAll",
//   passport.authenticate("profile", { session: false }),
//   DomainController.getPublicDomainMiddleWare,
//   CartController.deleteCartAll
// );

// router.delete(
//   "/public/domain/:domain/deleteCart",
//   passport.authenticate("profile", { session: false }),
//   DomainController.getPublicDomainMiddleWare,
//   CartController.deleteCart
// );


// router.delete(
//   "/public/domain/:domain/profile/:profile",
//   DomainController.getPublicDomainMiddleWare
// );
router.get(
  "/public/domain/:domain/products/:skuId",

  DomainController.getPublicDomainProducts,
  ProductController.getSKU
);

router.get(
  "/public/domain/:domain/all-products",

  DomainController.getPublicDomainProducts,
  ProductController.getAllProducts
);

router.get(
  "/public/domain/:domain/products",

  DomainController.getPublicDomainProducts,
  ProductController.get
);

router.get(
  "/public/domain/:domain",

  DomainController.getPublicDomain
);

router.get(
  "/domain/check/:domain",
  DomainController.checkSubdomain
);

export default router;
