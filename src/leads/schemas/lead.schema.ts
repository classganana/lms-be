import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  mobile: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: false })
  city?: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ required: false })
  pincode?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ type: Types.ObjectId, ref: 'Influencer', required: true })
  influencerId: Types.ObjectId;

  @Prop({ required: true })
  sourceCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

