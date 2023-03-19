/**
 * Define interface for User Profile Model
 *
 * @author Saravanan <saravanan@sociallink.one>
 */
import { Types } from "mongoose";


export interface IPricingPlan {
	_id: Types.ObjectId;
	name: string,
	subText: string,
	originalAmount: number,
	amount: number,
	features: string[]
}
