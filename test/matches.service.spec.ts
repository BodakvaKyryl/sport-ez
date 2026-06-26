import { PGlite } from "@electric-sql/pglite";
import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { DB } from "../src/db/db.provider";
import { matches } from "../src/db/schema";
import { MatchesService } from "../src/routes/matches.service";
import { MatchesGateway } from "../src/ws/matches.gateway";

const gateway = { broadcastMatchCreated: jest.fn(), broadcastScoreUpdated: jest.fn() };

const baseMatch = {
  sport: "football",
  homeTeam: "A",
  awayTeam: "B",
  startTime: "2099-01-01T18:00:00Z",
  endTime: "2099-01-01T20:00:00Z",
};

let client: PGlite;
let testDb: ReturnType<typeof drizzle>;
let service: MatchesService;

beforeAll(async () => {
  client = new PGlite();
  testDb = drizzle(client);
  await migrate(testDb, { migrationsFolder: "./drizzle" });

  const moduleRef = await Test.createTestingModule({
    providers: [
      MatchesService,
      { provide: MatchesGateway, useValue: gateway },
      { provide: DB, useValue: testDb },
    ],
  }).compile();
  service = moduleRef.get(MatchesService);
});

afterAll(() => client.close());

beforeEach(async () => {
  jest.clearAllMocks();
  await testDb.delete(matches);
});

describe("create", () => {
  it("derives scheduled status (future window) and broadcasts", async () => {
    const match = await service.create(baseMatch);
    expect(match.status).toBe("scheduled");
    expect(gateway.broadcastMatchCreated).toHaveBeenCalledWith(match);
  });

  it("derives finished status for a past window", async () => {
    const match = await service.create({
      ...baseMatch,
      startTime: "2000-01-01T18:00:00Z",
      endTime: "2000-01-01T20:00:00Z",
    });
    expect(match.status).toBe("finished");
  });

  it("derives live status for an ongoing window", async () => {
    const match = await service.create({
      ...baseMatch,
      startTime: "2000-01-01T18:00:00Z",
      endTime: "2099-01-01T20:00:00Z",
    });
    expect(match.status).toBe("live");
  });
});

describe("updateScore", () => {
  it("persists the new score and broadcasts", async () => {
    const created = await service.create(baseMatch);
    const updated = await service.updateScore(created.id, { homeScore: 2, awayScore: 1 });

    expect(updated.homeScore).toBe(2);
    expect(updated.awayScore).toBe(1);
    expect(gateway.broadcastScoreUpdated).toHaveBeenCalledWith(updated);
  });

  it("throws NotFound for a missing id", async () => {
    await expect(service.updateScore(999, { homeScore: 1, awayScore: 0 })).rejects.toThrow(
      NotFoundException
    );
  });
});

describe("findOne", () => {
  it("returns the match", async () => {
    const created = await service.create(baseMatch);
    expect(await service.findOne(created.id)).toMatchObject({ id: created.id });
  });

  it("throws NotFound for a missing id", async () => {
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});

describe("findAll", () => {
  const seed = (n: number) =>
    testDb.insert(matches).values(
      Array.from({ length: n }, () => ({
        sport: "football",
        homeTeam: "A",
        awayTeam: "B",
        startTime: new Date(baseMatch.startTime),
        endTime: new Date(baseMatch.endTime),
      }))
    );

  it("clamps limit to 100", async () => {
    await seed(105);
    expect(await service.findAll(1000)).toHaveLength(100);
  });

  it("defaults to 50 when no limit is given", async () => {
    await seed(60);
    expect(await service.findAll()).toHaveLength(50);
  });

  it("orders by createdAt descending", async () => {
    await testDb.insert(matches).values([
      { sport: "f", homeTeam: "A", awayTeam: "B", createdAt: new Date("2020-01-01T00:00:00Z") },
      { sport: "f", homeTeam: "A", awayTeam: "B", createdAt: new Date("2021-01-01T00:00:00Z") },
    ]);
    const [first, second] = await service.findAll();
    expect(first.createdAt.getTime()).toBeGreaterThan(second.createdAt.getTime());
  });
});
