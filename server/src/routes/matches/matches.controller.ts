import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

import {
  CreateMatchDto,
  ListMatchesQueryDto,
  MatchIdParamDto,
  UpdateScoreDto,
} from "../../validation/matches";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @AllowAnonymous()
  @Get()
  async findAll(@Query() query: ListMatchesQueryDto) {
    const data = await this.matchesService.findAll(query.limit);
    return { message: "Matches List", data };
  }

  @AllowAnonymous()
  @Get(":id")
  async findOne(@Param() params: MatchIdParamDto) {
    const data = await this.matchesService.findOne(params.id);
    return { message: "Match details", data };
  }

  @Post()
  async create(@Body() body: CreateMatchDto) {
    const data = await this.matchesService.create(body);
    return { message: "Match created", data };
  }

  @Patch(":id/score")
  async updateScore(@Param() params: MatchIdParamDto, @Body() body: UpdateScoreDto) {
    const data = await this.matchesService.updateScore(params.id, body);
    return { message: "Score updated", data };
  }
}
