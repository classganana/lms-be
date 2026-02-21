import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: false })
  name?: string;

  @Prop({ required: true, unique: true })
  mobile: string;

  @Prop({ required: false })
  state?: string;

  @Prop({ required: false })
  city?: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ required: false })
  pincode?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ type: Types.ObjectId, ref: "Influencer", required: false })
  influencerId?: Types.ObjectId;

  @Prop({ required: false })
  sourceCode?: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;

  // Latest interaction snapshot (optional, can be set on create or updated when interaction is added)
  @Prop({ required: false, enum: ["CONNECTED", "NOT_CONNECTED", "WRONG"] })
  callStatus?: "CONNECTED" | "NOT_CONNECTED" | "WRONG";

  @Prop({ required: false, min: 1, max: 5 })
  rating?: number;

  @Prop({ required: false })
  notes?: string;

  @Prop({ required: false })
  followUpDate?: Date;

  @Prop({ default: false })
  converted: boolean;

  /** GST status: APPLIED | YES | NO. Legacy gstCustomer (boolean) kept for backward compat. */
  @Prop({ required: false, enum: ["APPLIED", "YES", "NO"], default: "NO" })
  gstStatus?: "APPLIED" | "YES" | "NO";

  @Prop({ required: false })
  gstCustomer?: boolean; // deprecated, use gstStatus

  @Prop({ required: false })
  salesAmount?: number | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
