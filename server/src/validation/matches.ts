import { Type } from "class-transformer";
import {
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from "class-validator";

import { IsAfter } from "./is-after.validator";

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
} as const;

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

// GET /matches?limit=...
export class ListMatchesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number;
}

// Route params: /matches/:id
export class MatchIdParamDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id!: number;
}

// POST /matches body.
export class CreateMatchDto {
  @IsString()
  @IsNotEmpty({ message: "sport is required" })
  sport!: string;

  @IsString()
  @IsNotEmpty({ message: "homeTeam is required" })
  homeTeam!: string;

  @IsString()
  @IsNotEmpty({ message: "awayTeam is required" })
  awayTeam!: string;

  @IsISO8601({}, { message: "startTime must be a valid ISO date string" })
  startTime!: string;

  @IsISO8601({}, { message: "endTime must be a valid ISO date string" })
  @IsAfter("startTime", { message: "endTime must be after startTime" })
  endTime!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  awayScore?: number;
}

// PATCH /matches/:id/score body.
export class UpdateScoreDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeScore!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  awayScore!: number;
}
