import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DB } from "../../db/db.provider";
import { commentary, matches } from "../../db/schema";
import { CreateCommentaryDto } from "../../validation/commentary";
import { MatchesGateway } from "../../ws/matches.gateway";

@Injectable()
export class CommentaryService {
  constructor(
    @Inject(DB) private readonly db: NodePgDatabase,
    private readonly gateway: MatchesGateway
  ) {}

  findByMatch(matchId: number, limit?: number) {
    const safeLimit = Math.min(limit ?? 10, 100);
    return this.db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(safeLimit);
  }

  async create(matchId: number, body: CreateCommentaryDto) {
    const [match] = await this.db
      .select({ id: matches.id })
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) throw new NotFoundException(`Match ${matchId} not found.`);

    const [row] = await this.db
      .insert(commentary)
      .values({ matchId, ...body })
      .returning();

    this.gateway.broadcastCommentary(row);

    return row;
  }
}
