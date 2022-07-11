/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { IComment } from "../interfaces/models/commets";
import mongoose from '../providers/Database';
import { Schema } from 'mongoose';

// Create the model schema & register your custom methods here


// Define the CommentSchema Schema
export const CommentSchema = new mongoose.Schema<IComment>(
  {
    accountUserId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    from: { id: { type: String }, username: { type: String } },
    media: { id: { type: String }, media_product_type: { type: String } },
    id: { type: String },
    parent_id: { type: String },
    text: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);



const Comment = mongoose.model<IComment & mongoose.Document>(
  "Comment",
  CommentSchema
);

export default Comment;
