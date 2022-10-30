/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";
import { IAddress } from "./profile";



export interface IOrderHistory {
  _id: Types.ObjectId;

  
  orderId: Types.ObjectId;

  status:
    | "COMPLETED"
    | "DISPATCHED"
    | "CONFIRMED"
    | "PENDING"
    | "CANCELLED"
    | 'EDITED'
    | string;
  
  
  
  message : string;
  
}
