/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import {  Types } from "mongoose";


export interface INotificationBot {
  _id: Types.ObjectId;
  accountUserId: Types.ObjectId;
  name : string,
  description : string,
  tags : string[];

  posts : {
    type : "ALL" | 'SINGLE_POST',
    postId?: string
  }[]
}


