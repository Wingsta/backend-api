/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { INotificationBot } from "../interfaces/models/notificationbot";
import mongoose from '../providers/Database';

// Create the model schema & register your custom methods here


// Define the User Schema
export const NotificationBotSchema = new mongoose.Schema<INotificationBot>(
  {
    accountUserId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    description: { type: String },
    tags: { type: Array },
    
    posts: { type: Array },
  },
  {
    timestamps: true,
  }
);



const NotificationBot = mongoose.model<INotificationBot & mongoose.Document>(
  "NotificationBot",
  NotificationBotSchema
);

export default NotificationBot;
