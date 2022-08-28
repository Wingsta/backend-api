/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export interface IAccountUser {
  _id: Types.ObjectId;
  email: string;

  companyId: Types.ObjectId;
  password: string;
  website: string;
  name: string;
}

export interface ICompany {
  _id : Types.ObjectId;
  companyName: string;
  
}


