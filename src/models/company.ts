/**
 * Define User model
 *
 * @author Faiz A. Farooqui <faiz@geekyants.com>
 */

import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt-nodejs';

import { ICompany } from '../interfaces/models/accountuser';
import mongoose from '../providers/Database';

// Create the model schema & register your custom methods here


// Define the User Schema
export const CompanySchema = new mongoose.Schema<ICompany>(
  {
    email: { type: String, unique: true },

    companyId: { type: mongoose.Schema.Types.ObjectId },
    password: { type: String },
    website: { type: String },
  },
  {
    timestamps: true,
  }
);



const Company = mongoose.model<ICompany & mongoose.Document>(
  "Company",
  CompanySchema
);

export default Company;
