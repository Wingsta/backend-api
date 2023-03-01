/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { ITranscationLogs,TransactionStatusT,TransactionGatewayT,TransactionStatusConstantT } from '../interfaces/models/accountuser';
import mongoose from '../providers/Database';
import { Types ,Schema} from 'mongoose';

// Create the model schema & register your custom methods here

const transactionStatus = [
  "CREATED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "PROCESSING",
];

const transactionStatusConstant = ["IN", "OUT", "REFUND"];

const transactionGateway = ["RAZORPAY"];
// Define the User Schema
export const TranscationLogsSchema = new mongoose.Schema<ITranscationLogs>(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    userId: { type: String },
    status: {
      type: String,
      enum: transactionStatus,
      default: "created",
    },
    razorpayPaymentId: {
      type: String,
    },
    returnData: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    item: {
      type: Schema.Types.Mixed,
      default: () => [],
    },
    totalAmount: {
      type: Number,
    },
    transactionStatus: {
      type: String,
      enum: transactionStatusConstant,
      default: "in",
    },
    gateway: {
      type: String,
      enum: transactionGateway,
    },
    mode: {
      type: String,
    },
    orderId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);



const TranscationLogs = mongoose.model<ITranscationLogs & mongoose.Document>(
  "TranscationLog",
  TranscationLogsSchema
);

export default TranscationLogs;
