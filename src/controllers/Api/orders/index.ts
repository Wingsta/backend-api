import { NextFunction, Request, Response } from "express";
import { ObjectID, ObjectId } from "mongodb";
import Company from "../../../models/company";
import { IProducts } from "../../../interfaces/models/products";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../services/response/sendresponse";
import { IAddress } from "../../../interfaces/models/profile";
import Cart from "../../../models/cart";
import Order from "../../../models/orders";
import moment = require("moment");
import OrderHistory from "../../../models/orderhistory";
import {
  createRazorpayOrder,
  ORDER_STATUS,
  PAYMENT_METHOD,
} from "../../../utils/constants";

import { calculateDeliveryCharge } from "../common/common";
const crypto = require("crypto");
const axios = require("axios");
import puppeteer from "puppeteer";
import Domain from "../../../models/domain";



class ProfileController {
	public static async getOrders(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {

			let { id, companyId } = req.user as { companyId: string; id: string };

			if (!id) {
				return res.json(sendErrorResponse("unauthorised"));
			}
			let {
				limit = 10,
				offset = 0,
				startDate,
				endDate,
				sortBy = "createdAt",
				sortType = "desc",
				status,
			} = req.query as unknown as {
				limit: number;
				offset: number;
				sortBy: string;
				startDate: Date;
				endDate: Date;
				sortType: string;
				status: string;
			};

			if (limit) {
				limit = parseInt(limit.toString());
			}

			if (offset) {
				offset = parseInt(offset.toString());
			}
			let mongoQuery = {
				companyId: new ObjectId(companyId),
				userId: new ObjectId(id),
			} as any;

			if (status) {
				let statusTypes = status.split(",");
				mongoQuery["status"] = { $in: statusTypes };
			}

			if (startDate) {
				if (!mongoQuery["$and"]) {
					mongoQuery["$and"] = []
				}
				mongoQuery['$and'].push({
					createdAt: {
						$gte: moment(startDate).startOf("day").toDate(),
					}
				})
			}

			if (endDate) {
				if (!mongoQuery["$and"]) {
					mongoQuery["$and"] = []
				}
				mongoQuery["$and"].push({
					createdAt: {
						$lte: moment(endDate).endOf("day").toDate(),
					}
				});

			}

			let orderDetails = await Order.find(mongoQuery)
				.sort([[sortBy, sortType === "asc" ? 1 : -1]])
				.skip(offset)
				.limit(limit)
				// .populate("userId")
				.lean();

			let count = await Order.count(mongoQuery);

			if (orderDetails) {
				return res.json(
					sendSuccessResponse({
						orderDetails: orderDetails,
						count,
					})
				);
			}

			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async getOrdersCount(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {

			let { id, companyId } = req.user as { companyId: string; id: string };

			if (!id) {
				return res.json(sendErrorResponse("unauthorised"));
			}


			let orderDetails = await Order.count({
				userId: new ObjectId(id),
				companyId: new ObjectId(companyId),
			})

			if (orderDetails !== undefined) {
				return res.json(
					sendSuccessResponse({
						count: orderDetails,
					})
				);
			}

			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

  public static async getPdfBlob(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { id, companyId } = req.user as { companyId: string; id: string };

      if (!id) {
        return res.json(sendErrorResponse("unauthorised"));
      }
      let { id:orderId } = req.params as unknown as {
        id: string;
      };
      let domainDetails = (await Domain.find({ companyId }).lean())[0];

      let orderDetails = await Order.findOne({ _id: orderId }).lean();

      if (!domainDetails || !domainDetails.metaData) {
        return res.json(sendErrorResponse("domain details missing"));
      }

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      let {
        logo,
        logoText = "No Company Name",
        addressLine1 = "Address Line 1",
        addressLine2 = "Address Line 2",
        city = "City",
        pincode = "pincode",
        state = "state",
        mobile = "mobile",
        email = "email",
      } = domainDetails?.metaData;
      const getHtml = () => {
        return `
          <!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <title>A simple, clean, and responsive HTML invoice template</title>

    <style>
        .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            font-size: 16px;
            line-height: 24px;
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            color: #555;
        }

        .invoice-box table {
            width: 100%;
            line-height: inherit;
            text-align: left;
        }

        .invoice-box table td {
            padding: 5px;
            vertical-align: top;
        }

          .invoice-box table tr  {
            text-align: right;
        }
        .invoice-box table tr td:nth-child(1) {
            text-align: left;
        }

        .invoice-box table tr.top table td {
            padding-bottom: 20px;
        }

        .invoice-box table tr.top table td.title {
            font-size: 45px;
            line-height: 45px;
            color: #333;
        }

        .invoice-box table tr.information table td {
            padding-bottom: 40px;
        }

        .invoice-box table tr.heading td {
            background: #eee;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
        }

        .invoice-box table tr.details td {
            padding-bottom: 20px;
        }

        .invoice-box table tr.item td {
            border-bottom: 1px solid #eee;
        }

        .invoice-box table tr.item.last td {
            border-bottom: none;
        }

        .invoice-box table tr.total td:nth-child(4) {
            border-top: 2px solid #eee;
            font-weight: bold;
        }

        @media only screen and (max-width: 600px) {
            .invoice-box table tr.top table td {
                width: 100%;
                display: block;
                text-align: center;
            }

            .invoice-box table tr.information table td {
                width: 100%;
                display: block;
                text-align: center;
            }
        }

        /** RTL **/
        .invoice-box.rtl {
            direction: rtl;
            font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
        }

        .invoice-box.rtl table {
            text-align: right;
        }

        .invoice-box.rtl table tr td:nth-child(2) {
            text-align: left;
        }

   /* CSS styles for the footer */
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3B5998;
  color: #FFFFFF;
  font-family: sans-serif;
  font-size: 1.5em;
  
}
.footer img {
  margin-right: 0.5em;
}

    </style>
</head>

<body>
    <div class="invoice-box">
        <table cellpadding="0" cellspacing="0">
            <tr class="top">
                <td colspan="2">
                    <table>
                        <tr>
                            <td class="title">
                                <img src="${logo}"
                                    style="width: 100%; max-width: 300px" />
                            </td>

                            <td>
                                Invoice #: ${orderDetails._id}<br />
                                Created At: ${moment(
                                  orderDetails?.createdAt
                                )}<br />
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr class="information">
                <td colspan="2">
                    <table>
                        <tr>
                            <td>
                                ${logoText}<br />
                                ${addressLine1}<br />
                                ${addressLine2}, ${city} ${pincode}
                            </td>

                            <td>
                                ${
                                  orderDetails?.deliveryAddress?.name || ""
                                }<br />
                                ${
                                  orderDetails?.deliveryAddress?.addressLine1 ||
                                  ""
                                }<br />
                                 ${
                                   orderDetails?.deliveryAddress
                                     ?.addressLine2 || ""
                                 } ${
          orderDetails?.deliveryAddress?.city || ""
        } ${orderDetails?.deliveryAddress?.pincode || ""}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                GSTN : ""
                            </td>
                        
                            <td>
                                ${
                                  orderDetails?.deliveryAddress?.name || ""
                                }<br />
                                ${
                                  orderDetails?.deliveryAddress?.addressLine1 ||
                                  ""
                                }<br />
                                 ${
                                   orderDetails?.deliveryAddress
                                     ?.addressLine2 || ""
                                 } ${
          orderDetails?.deliveryAddress?.city || ""
        } ${orderDetails?.deliveryAddress?.pincode || ""}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr class="heading">
                <td>Payment Method</td>

                <td>${orderDetails?.paymentMethod || "CASH"} #</td>
            </tr>

            <tr class="details">
                <td>Amount</td>

                <td>${orderDetails?.totalAfterTax || "00"}</td>
            </tr>

            <table>
                <tr class="heading">
                    <td>Item</td>
                <td>Price</td>
                <td>Quantity</td>
                    <td>Total</td>
                </tr>
                
                ${orderDetails?.products?.map(
                  (it) => `<tr class="item">
                    <td>${it?.name}</td>
                <td>${it.price}</td>
                <td>${it.quantity}</td>
                    <td>₹${(
                      parseFloat(it.price?.toString()) * parseFloat(it.quantity)
                    )?.toFixed(2)}</td>
                </tr>`
                )}
                 <tr class="heading">
                    <td>delivery</td>
                <td></td>
                <td></td>
                    <td>₹${orderDetails?.delivery || "00"}</td>
                </tr>
                  <tr class="heading">
                    <td></td>
                <td></td>
                <td></td>
                    <td>₹${orderDetails?.totalAfterTax || "00"}</td>
                </tr>
            </table>
        </table>

    <div class="footer">
        <img src="https://sociallink.one/assets/img/icon-logo.png" alt="Sociallink logo"  style="width: 40px">
        <p>Powered by Sociallink</p>
    </div>
    </div>
</body>

</html>

          `;
      };
      await page.setContent(getHtml());

      let pdf = await page.pdf();
      await browser.close();


      if (orderDetails) {
            res.contentType("application/pdf");
            res.send(pdf);
            return;
      }

      return res.json(sendErrorResponse("something went wrong"));
    } catch (error) {
      next(error);
    }
  }
	public static async postOrder(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {

			let cartId = req.body.cartId as string[];
			let deliveryAddress = req.body.deliveryAddress as IAddress;
			let paymentMethod = req.body.paymentMethod;
			let preview = req.body.preview;

			let { id, companyId } = req.user as { companyId: string; id: string };

			if (!id) {
				return res.json(sendErrorResponse("unauthorised"));
			}

			if (!preview && !deliveryAddress) {
				return res.json(sendErrorResponse("deliveryAddress needed"));
			}

			if (!preview && !paymentMethod) {
				return res.json(sendErrorResponse("deliveryAddress needed"));
			}

			let query = {} as any;
			if (cartId?.length) {
				query = { _id: { $in: cartId.map((it) => new ObjectId(it)) } };
			}
			let cartIdFound = [] as string[]
			let products = (
				await Cart.find({
					...query,
					userId: new ObjectId(id),
				})
					.populate("productId")
					.lean()
			)?.map((it) => {
				let product = it?.productId as any as IProducts;
				cartIdFound.push(it._id)
				return {
					name: product?.name,
					sku: product?.sku,
					quantity: it?.quantity || 1,
					thumbnail: product?.thumbnail,
					productId: product?._id,
					price: product?.price,
				};
			});

			const reducedProduct = products.reduce((a, b) => {
				let k = { ...a }
				k.price =
					((a?.quantity || 1) * (a?.price || 0)) + ((b?.quantity || 1) * (b?.price || 0));
				k.quantity = undefined;
				return k;
			});
			let total = products?.length
				? (reducedProduct?.quantity || 1) * (reducedProduct?.price || 0)
				: 0;
			let tax = 0;

			if (!products) {
				return res.json(sendErrorResponse("products not found"));
			}

			const orderAmount = (total + tax).toFixed(2)

			const {
				pincode,
            	deliveryCost
			} = await calculateDeliveryCharge(companyId, orderAmount);

			let totalAfterTax = (total + tax + deliveryCost).toFixed(2);

			if (preview)
				return res.json(
					sendSuccessResponse({
						userId: id,
						products: products,
						total,
						tax,
						delivery: deliveryCost,
						totalAfterTax,
						deliveryAddress,
						paymentMethod,
						pincode
					})
				);
			
			let status = ORDER_STATUS.PROCESSING;

			let razorpayData = {};

			if (paymentMethod === PAYMENT_METHOD.RAZORPAY) {
				
				const company = await Company.findById(companyId);

				if (!company) {
					throw new Error("Store details not found!");
				}

				const {
					razorpayAppId,
					razorpaySecretKey
				} = company;

				if (!(razorpayAppId && razorpaySecretKey)) {
					throw new Error("Razorpay creds not found!");
				}

				const orderData = await createRazorpayOrder(razorpayAppId, razorpaySecretKey, +totalAfterTax);

				razorpayData = {
					razorpayOrderId: orderData?.id,
					returnData: orderData
				}

				status = ORDER_STATUS.PAYMENT_PROCESSING
			}

			let order = await new Order({
				userId: new ObjectId(id),
				companyId: companyId,
				products: products,
				status,
				total,
				tax,
				delivery: deliveryCost,
				totalAfterTax,
				deliveryAddress,
				paymentMethod,
				...razorpayData
			}).save();

			if (order?._id) {
				await Cart.deleteMany({ _id: { $in: cartIdFound.map(it => new ObjectID(it)) } });
				return res.json(
					sendSuccessResponse({
						...order.toJSON(),
					})
				);
			}

			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}

	public static async updateRazorpayPayment(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {

			let razorpay_order_id = req.body.razorpay_order_id as string;

			let { id, companyId } = req.user as { companyId: string; id: string };

			if (!id) {
				return res.json(sendErrorResponse("unauthorised"));
			}

			if (!razorpay_order_id) {
				throw new Error("Razorpay order id is required!");
			}

			const company = await Company.findById(companyId);

			if (!company) {
				throw new Error("company details not found!");
			}

			const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

			if (!order) {
				throw new Error("order details not found!");
			}

			const { razorpayAppId, razorpaySecretKey  } = company;

			const generatedSignature = crypto.createHmac("SHA256", razorpaySecretKey)
				.update(req.body.razorpay_order_id + '|' + req.body.razorpay_payment_id)
				.digest('hex');

			if (generatedSignature !== req.body.razorpay_signature) {

				await Order.findOneAndUpdate(
					{
						razorpayOrderId: req.body.razorpay_order_id
					},
					{ 
						status: ORDER_STATUS.PAYMENT_FAILED 
					}
				);

				return res.json(sendErrorResponse("Invalid Transaction!"));
			}

			let mode = "Others";

			// Get payment method from razorpay
			const paymentData = await axios.get(`https://${razorpayAppId}:${razorpaySecretKey}@api.razorpay.com/v1/payments/${req.body.razorpay_payment_id}/?expand[]=card`);
			if (paymentData?.data) {
				
				const { method } = paymentData.data;
				if (method) {
					switch (method) {
						case 'card':
							if (paymentData.data.card) {
								const { type } = paymentData.data.card;
								if (type) {
									if (type === 'debit') {
										mode = 'Debit';
									} else if (type === 'credit') {
										mode = 'Credit';
									}
								}
							}
							break;
						case 'upi':
							mode = 'UPI';
							break;
						case 'netbanking':
							mode = 'Netbanking';
							break;
						case 'wallet':
							mode = 'Wallet';
							break;
						case 'emi':
						case 'cardless_emi':
							mode = 'EMI';
							break;
						default:
							break;
					}
				}

				if (paymentData?.data?.status === "captured") {
					await Order.findOneAndUpdate(
						{
							razorpayOrderId: razorpay_order_id
						},
						{
							status: ORDER_STATUS.CONFIRMED,
							mode: mode,
							returnData: { ...order.returnData, ...req.body },
							razorpayPaymentId: req.body.razorpay_payment_id
						}
					);
				} else if (paymentData?.data?.status === "failed") {
					await Order.findOneAndUpdate(
						{
							razorpayOrderId: razorpay_order_id
						},
						{
							status: ORDER_STATUS.PAYMENT_FAILED
						}
					);
				}
			}

			return res.json(sendSuccessResponse(null, "Payment status updated successfully!"));
		} catch (error) {
			next(error);
		}
	}

	public static async updateRazorpayPaymentWebhook(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {

			const { payload } = req.body;
			
			if (payload?.payment?.entity) {
				const { order_id, id } = payload?.payment?.entity;

				const order = await Order.findOne({ 
					razorpayOrderId: order_id,
					status: ORDER_STATUS.PAYMENT_PROCESSING
				});

				if (order) {

					const company = await Company.findById(order?.companyId);

					if (company && company?.razorpayAppId && company?.razorpaySecretKey) {

						const { razorpayAppId, razorpaySecretKey  } = company;

						let mode = "Others";

						// Get payment method from razorpay
						const paymentData = await axios.get(`https://${razorpayAppId}:${razorpaySecretKey}@api.razorpay.com/v1/payments/${id}/?expand[]=card`);
						if (paymentData?.data) {

							const { method } = paymentData?.data;
							if (method) {
								switch (method) {
									case 'card':
										if (paymentData.data.card) {
											const { type } = paymentData.data.card;
											if (type) {
												if (type === 'debit') {
													mode = 'Debit';
												} else if (type === 'credit') {
													mode = 'Credit';
												}
											}
										}
										break;
									case 'upi':
										mode = 'UPI';
										break;
									case 'netbanking':
										mode = 'Netbanking';
										break;
									case 'wallet':
										mode = 'Wallet';
										break;
									case 'emi':
									case 'cardless_emi':
										mode = 'EMI';
										break;
									default:
										break;
								}
							}

							if (paymentData?.data?.status === "captured") {
								await Order.findOneAndUpdate(
									{
										razorpayOrderId: order_id
									},
									{
										status: ORDER_STATUS.CONFIRMED,
										mode: mode,
										returnData: { ...order.returnData, ...payload.payment.entity },
										razorpayPaymentId: paymentData?.data?.id
									}
								);
							} else if (paymentData?.data?.status === "failed") {
								await Order.findOneAndUpdate(
									{
										razorpayOrderId: order_id
									},
									{
										status: ORDER_STATUS.PAYMENT_FAILED 
									}
								);
							}

						}
					}
				}
			}

			res.status(200).send('Success')
		} catch (error) {
			next(error);
		}
	}

	public static async cancelRazorpayPayment(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {

			let razorpay_order_id = req.body.razorpay_order_id as string;

			await Order.findOneAndUpdate(
				{
					razorpayOrderId: razorpay_order_id
				},
				{ 
					status: ORDER_STATUS.PAYMENT_FAILED 
				}
			);

			return res.json(sendErrorResponse("Payment status updated successfully!"));
		} catch (error) {
			next(error);
		}
	}

	public static async statusUpdate(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {

			let orderId = req.params.orderId as string;

			let status = req.body.status as string;

			let { id, companyId } = req.user as { companyId: string; id: string };

			if (!id) {
				return res.json(sendErrorResponse("unauthorised"));
			}

			if (!status) {
				return res.json(sendErrorResponse("status needed"));
			}

			let update = await Order.updateOne(
				{ companyId: companyId, _id: new ObjectId(orderId) },
				{ $set: { status } },
				{ upsert: true }
			);

			if (update?.ok) {
				await OrderHistory.insertMany([{ orderId: id, status }]);
				return res.json(sendSuccessResponse({ message: "updated status" }));
			}
			return res.json(sendErrorResponse("something went wrong"));
		} catch (error) {
			next(error);
		}
	}
}
export default ProfileController;
