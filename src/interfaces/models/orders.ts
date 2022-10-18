/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";
import { IAddress } from "./profile";

export interface IOrderProducts {
  name: string;
  sku: string;
  quantity: string;
  thumbnail : string;
  productId: Types.ObjectId;
  price :  number,
}

export interface IOrder {
  _id: Types.ObjectId;

  products: IOrderProducts[];
  userId: Types.ObjectId;
  companyId: Types.ObjectId;
  status:
    | "COMPLETED"
    | "DISPATCHED"
    | "CONFIRMED"
    | "PENDING"
    | "CANCELLED"
    | string;
  deliveryAddress: IAddress;
  total : number;
  tax : number;
  totalAfterTax : number;
  paymentMethod: "CARD" | "CASH" | "UPI" | "NET-BANKING" | "FREE";
}
