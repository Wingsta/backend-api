/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IOrder } from "../interfaces/models/orders";
import mongoose from "../providers/Database";
import { Schema, Types } from "mongoose";

// Create the model schema & register your custom methods here
const Address = new Schema({
  name: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
});

const OrderProducts = new Schema({
  name: { type: String },
  sku: { type: String },
  quantity: { type: String },
  thumbnail: { type: String },
  productId: { type: Types.ObjectId, ref: "Product" },
  price: { type: Number },
});
// Define the Profile Schema
export const OrderSchema = new mongoose.Schema<IOrder>(
  {
    companyId: { type: Types.ObjectId, ref: "Company" },
    sku: { type: String },
    name: { type: String },

    userId: { type: Types.ObjectId, ref: "Profile" },
    status: { type: String },
    deliveryAddress: Address,
    paymentMethod: { type: String },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model<IOrder & mongoose.Document>("Order", OrderSchema);

export default Order;
