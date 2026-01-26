import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInfluencerDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the influencer' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

