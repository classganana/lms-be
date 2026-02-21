import { ApiProperty } from "@nestjs/swagger";

export class SourceCodeResponseDto {
  @ApiProperty({ example: "SRC123", description: "Source code" })
  code: string;

  @ApiProperty({
    example: "ACTIVE",
    enum: ["ACTIVE", "INACTIVE"],
    description: "Source code status",
  })
  status: "ACTIVE" | "INACTIVE";

  @ApiProperty({
    example: "2026-01-22T16:07:52.623Z",
    description: "Activation timestamp",
  })
  activatedAt: Date;

  @ApiProperty({
    example: null,
    nullable: true,
    description: "Deactivation timestamp",
  })
  deactivatedAt?: Date | null;
}

export class InfluencerResponseDto {
  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Influencer ID",
  })
  _id: string;

  @ApiProperty({ example: "John Influencer", description: "Influencer name" })
  name: string;

  @ApiProperty({ example: true, description: "Whether influencer is active" })
  isActive: boolean;

  @ApiProperty({
    type: [SourceCodeResponseDto],
    description: "List of source codes",
  })
  sourceCodes: SourceCodeResponseDto[];

  @ApiProperty({
    example: "2026-01-22T16:07:52.623Z",
    description: "Creation timestamp",
  })
  createdAt?: Date;

  @ApiProperty({
    example: "2026-01-22T16:07:52.623Z",
    description: "Last update timestamp",
  })
  updatedAt?: Date;
}
