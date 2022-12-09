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
import { createRazorpayOrder, ORDER_STATUS, PAYMENT_METHOD } from "../../../utils/constants";
const crypto = require("crypto");
const axios = require("axios");
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
				return k;
			});
			let total = products?.length
				? (reducedProduct?.quantity || 1) * (reducedProduct?.price || 0)
				: 0;
			let tax = 0;
			let totalAfterTax = (total + tax).toFixed(2);

			if (!products) {
				return res.json(sendErrorResponse("products not found"));
			}

			if (preview)
				return res.json(
					sendSuccessResponse({
						userId: id,
						products: products,
						total,
						tax,
						totalAfterTax,
						deliveryAddress,
						paymentMethod,
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
