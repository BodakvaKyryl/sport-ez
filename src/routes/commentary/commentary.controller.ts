import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

import { CreateCommentaryDto, ListCommentaryQueryDto } from "../../validation/commentary";
import { MatchIdParamDto } from "../../validation/matches";
import { CommentaryService } from "./commentary.service";

@Controller("matches/:id/commentary")
export class CommentaryController {
  constructor(private readonly commentaryService: CommentaryService) {}

  @AllowAnonymous()
  @Get()
  async findAll(@Param() params: MatchIdParamDto, @Query() query: ListCommentaryQueryDto) {
    const data = await this.commentaryService.findByMatch(params.id, query.limit);
    return { message: "Commentary list", data };
  }

  @Post()
  async create(@Param() params: MatchIdParamDto, @Body() body: CreateCommentaryDto) {
    const data = await this.commentaryService.create(params.id, body);
    return { message: "Commentary created", data };
  }
}
