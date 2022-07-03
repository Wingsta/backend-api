/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Schema, Types } from "mongoose";
export interface IAccessToken {
  accessToken: string;
  data_access_expiration_time: number;
  userID: string;
  accountUserId: Types.ObjectId;
  type: "FACEBOOK" | "GOOGLE";
}

export interface IAccountUser {
  _id: Types.ObjectId;
  email: string;
  expiresIn: number;
  graphDomain: string;
  name: string;
  userID: string;
  picture: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
}


