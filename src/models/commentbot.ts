/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { ICommentBot } from "../interfaces/models/commentbot";
import mongoose from '../providers/Database';

// Create the model schema & register your custom methods here


// Define the User Schema
export const CommentBotSchema = new mongoose.Schema<ICommentBot>(
  {
    accountUserId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    description: { type: String },
    tags: { type: Array },
    comment: { type: Object },
    posts: { type: Array },
  },
  {
    timestamps: true,
  }
);



const CommentBot = mongoose.model<ICommentBot & mongoose.Document>(
  "CommentBot",
  CommentBotSchema
);

export default CommentBot;
