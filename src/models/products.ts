/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IProducts } from "../interfaces/models/products";
import mongoose from "../providers/Database";
import { Types } from "mongoose";

// Create the model schema & register your custom methods here

// Define the User Schema
export const ProductSchema = new mongoose.Schema<IProducts>(
	{
		companyId: { type: Types.ObjectId, ref: "Company" },
		name: { type: String },
		price: { type: Number },
		status: { type: Number },
		sku: { type: String },
		quantity: { type: Number },
		addedDate: { type: Date },
		thumbnail: { type: String },
		carouselImages: { type: Array },
		categoryId: { type: Types.ObjectId, ref: "Category" },
		posts: [{ type: Types.ObjectId, ref: "Post" }],
		originalPrice: { type: Number },
		description: { type: String },
		productUnitCount: { type: Number },
		productUnitLabel: { type: String },
		createdAt: { type: Date },
		updatedAt: { type: Date },
	},
	{
		timestamps: true,
	}
);

const Product = mongoose.model<IProducts & mongoose.Document>(
	"Product",
	ProductSchema
);

export default Product;
