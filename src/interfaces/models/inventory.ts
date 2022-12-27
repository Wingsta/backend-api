/**
 * Define interface for User Profile Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";



export interface IIventory {
  _id: Types.ObjectId;

  customerName: string;
  address: string;
  gstin: string;
  invoice: string;
  total: number;
  contactPersonName: string;
  contactPersonNumber: string;
  purchaseDate: string;
  products: {
    productId: string;
    count: number;
    purchasePrice: number;
    skuId: string;
    size : string,
    color : string;
  }[];
  userId: Types.ObjectId;
  companyId: Types.ObjectId;
  status: "IN_STOCK" | "OUT_STOCK" | "RETURNED" | "CANCELLED" | string;
  invoiceNumber : string;
  notes: string;
}
