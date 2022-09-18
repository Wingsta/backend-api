/**
 * Define interface for Account User Model
 *
 * @author Vishal <vishal@vishhh.com>
 */
import { Types } from "mongoose";


export interface IDomain {
  _id: Types.ObjectId;
  name : string,
  companyId: Types.ObjectId;
  metaData : {[key : string] : any}
  
  
}


