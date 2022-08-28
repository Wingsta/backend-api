/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IProducts } from "../interfaces/models/products";
import mongoose from "../providers/Database";

// Create the model schema & register your custom methods here

// Define the User Schema
export const ProductSchema = new mongoose.Schema<IProducts>(
  {
    companyId: { type: String },
    name: { type: String },
    price: { type: Number },
    status: { type: Number },
    sku: { type: String },
    quantity: { type: Number },
    addedDate: { type: Date },
    thumbnail: { type: String },
    carouselImages: { type: Array },
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
