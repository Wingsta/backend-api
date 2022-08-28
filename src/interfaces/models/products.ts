/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export interface IProducts {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  price: number;
  status: number;
  sku: string;
  quantity: number;
  addedDate: Date;
  thumbnail: string;
  carouselImages : string[];
}


