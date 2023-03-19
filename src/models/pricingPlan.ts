/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt-nodejs";

import { IPricingPlan } from "../interfaces/models/pricingPlan";
import mongoose from "../providers/Database";
import { Schema, Types } from "mongoose";

// Create the model schema & register your custom methods here


// Define the Pricing Plan Schema
export const PricingPlanSchema = new mongoose.Schema<IPricingPlan>(
	{
		name: { type: String },
		subText: { type: String },
		originalAmount: { type: Number },
		amount: { type: Number },
		features: {
			type: Schema.Types.Mixed,
			default: () => ([]),
		}
	},
	{
		timestamps: true,
	}
);

const PricingPlan = mongoose.model<IPricingPlan & mongoose.Document>("PricingPlan", PricingPlanSchema);

export default PricingPlan;
