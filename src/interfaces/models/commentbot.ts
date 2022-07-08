/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import {  Types } from "mongoose";


export interface ICommentBot {
  _id: Types.ObjectId;
  accountUserId: Types.ObjectId;
  name : string,
  description : string,
  tags : string[];
  comment : {
    commentString : string,
  },
  posts : {
    type : "ALL" | 'SINGLE_POST',
    postId?: string
  }[]
}


