import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Influencer, InfluencerDocument } from "./schemas/influencer.schema";
import { CreateInfluencerDto } from "./dto/create-influencer.dto";
import { AddSourceCodeDto } from "./dto/add-source-code.dto";

@Injectable()
export class InfluencersService {
  constructor(
    @InjectModel(Influencer.name)
    private influencerModel: Model<InfluencerDocument>,
  ) {}

  async create(
    createInfluencerDto: CreateInfluencerDto,
  ): Promise<InfluencerDocument> {
    try {
      return await this.influencerModel.create(createInfluencerDto);
    } catch (error) {
      console.error("Error creating influencer:", error);
      throw error;
    }
  }

  async findAll(opts?: {
    skip?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
  }): Promise<InfluencerDocument[]> {
    let q = this.influencerModel.find();
    if (opts?.sort && Object.keys(opts.sort).length) {
      q = q.sort(opts.sort);
    } else {
      q = q.sort({ createdAt: -1 });
    }
    if (opts?.skip != null) q = q.skip(opts.skip);
    if (opts?.limit != null && opts.limit > 0) q = q.limit(opts.limit);
    return q.exec();
  }

  async findAllActive(): Promise<any[]> {
    const influencers = await this.influencerModel
      .find({ isActive: true })
      .exec();
    // Filter to only show ACTIVE source codes for non-admin
    return influencers.map((influencer) => ({
      ...influencer.toObject(),
      sourceCodes: influencer.sourceCodes.filter(
        (sc) => sc.status === "ACTIVE",
      ),
    }));
  }

  async addSourceCode(
    id: string,
    addSourceCodeDto: AddSourceCodeDto,
  ): Promise<InfluencerDocument> {
    const influencer = await this.influencerModel.findById(id).exec();
    if (!influencer) {
      throw new NotFoundException("Influencer not found");
    }

    // Check if source code already exists globally
    const existingInfluencer = await this.influencerModel
      .findOne({
        "sourceCodes.code": addSourceCodeDto.code,
      })
      .exec();

    if (existingInfluencer) {
      throw new ConflictException("Source code already exists");
    }

    // Add new source code as INACTIVE - admin activates via UI
    influencer.sourceCodes.push({
      code: addSourceCodeDto.code,
      status: "INACTIVE",
      activatedAt: new Date(),
      deactivatedAt: null,
    });

    return influencer.save();
  }

  async findOne(id: string): Promise<InfluencerDocument | null> {
    return this.influencerModel.findById(id).exec();
  }

  async update(
    id: string,
    updateDto: { name?: string; isActive?: boolean },
  ): Promise<InfluencerDocument> {
    const influencer = await this.influencerModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
      .exec();
    if (!influencer) {
      throw new NotFoundException("Influencer not found");
    }
    return influencer;
  }

  async remove(id: string): Promise<void> {
    const result = await this.influencerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException("Influencer not found");
    }
  }

  async updateSourceCodeStatus(
    id: string,
    code: string,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<InfluencerDocument> {
    const influencer = await this.influencerModel.findById(id).exec();
    if (!influencer) {
      throw new NotFoundException("Influencer not found");
    }

    const sc = influencer.sourceCodes.find(
      (s) => s.code.toLowerCase() === code.toLowerCase(),
    );
    if (!sc) {
      throw new NotFoundException("Source code not found");
    }

    sc.status = status;
    if (status === "ACTIVE") {
      sc.activatedAt = new Date();
      sc.deactivatedAt = null;
    } else {
      sc.deactivatedAt = new Date();
    }

    return influencer.save();
  }
}
