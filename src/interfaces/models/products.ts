/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export type IVariant = {
	sku: string;
	price: number;
	originalPrice: number;
	quantity: number;
	size: {
		label: string;
		value: string;
	};
	color: {
		label: string;
		value: string;
	};
};

export interface IProducts {
  _id?: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  price: number;
  originalPrice: number;
  status: number;
  sku: string;
  quantity: number;
  addedDate: Date;
  thumbnail: string;
  carouselImages: string[];
  categoryId?: Types.ObjectId;
  posts: any[];

  description: string;
  productUnitCount: number;
  productUnitLabel: string;
  variants?: IVariant[];
}


