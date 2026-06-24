import { Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";

import { db } from "../db/db";
import { matches } from "../db/schema";
import { getMatchStatus } from "../utils/match-status";
import { CreateMatchDto, MATCH_STATUS, UpdateScoreDto } from "../validation/matches";

@Injectable()
export class MatchesService {
  async create(body: CreateMatchDto) {
    const status = getMatchStatus(body.startTime, body.endTime) ?? MATCH_STATUS.SCHEDULED;

    const [match] = await db
      .insert(matches)
      .values({
        sport: body.sport,
        homeTeam: body.homeTeam,
        awayTeam: body.awayTeam,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        homeScore: body.homeScore,
        awayScore: body.awayScore,
        status,
      })
      .returning();

    return match;
  }

  findAll(limit?: number) {
    const safeLimit = Math.min(limit ?? 50, 100);
    return db.select().from(matches).orderBy(desc(matches.createdAt)).limit(safeLimit);
  }

  async findOne(id: number) {
    const [match] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);

    if (!match) throw new NotFoundException(`Match ${id} not found.`);

    return match;
  }

  async updateScore(id: number, body: UpdateScoreDto) {
    const [match] = await db
      .update(matches)
      .set({ homeScore: body.homeScore, awayScore: body.awayScore })
      .where(eq(matches.id, id))
      .returning();

    if (!match) throw new NotFoundException(`Match ${id} not found.`);

    return match;
  }
}
