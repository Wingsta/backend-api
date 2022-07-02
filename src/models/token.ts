/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { IAccessToken } from '../interfaces/models/accountuser';
import mongoose from '../providers/Database';

// Create the model schema & register your custom methods here
export interface IAccessTokenModel extends IAccessToken, mongoose.Document {}

// Define the User Schema
export const AccessTokenSchema = new mongoose.Schema<IAccessToken>(
  {
    accessToken: { type: String,  },
data_access_expiration_time: { type: String, },
type: { type: String, },
userId : {type : String},
 
  },
  {
    timestamps: true,
  }
);



const AccessToken = mongoose.model<IAccessTokenModel>(
  "AccessToken",
  AccessTokenSchema
);

export default AccessToken;
