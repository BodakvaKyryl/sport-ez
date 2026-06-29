import { PGlite } from "@electric-sql/pglite";
import { INestApplication } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import { Test } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { DB } from "../src/db/db.provider";
import { commentary, matches } from "../src/db/schema";

const validBody = {
  minute: 42,
  sequence: 120,
  period: "2nd half",
  eventType: "goal",
  actor: "Alex Morgan",
  team: "FC Neon",
  message: "GOAL! Powerful finish.",
  metadata: { assist: "Sam Kerr" },
  tags: ["goal", "shot"],
};

let client: PGlite;
let testDb: ReturnType<typeof drizzle>;
let app: INestApplication;
let matchId: number;

beforeAll(async () => {
  client = new PGlite();
  testDb = drizzle(client);
  await migrate(testDb, { migrationsFolder: "./drizzle" });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DB)
    .useValue(testDb)
    .compile();

  app = moduleRef.createNestApplication();
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.init();
});

afterAll(async () => {
  await app.close();
  await client.close();
});

beforeEach(async () => {
  await testDb.delete(commentary);
  await testDb.delete(matches);
  const [match] = await testDb
    .insert(matches)
    .values({ sport: "football", homeTeam: "A", awayTeam: "B" })
    .returning();
  matchId = match.id;
});

describe("POST /matches/:id/commentary", () => {
  it("creates commentary and returns 201 with the persisted row", async () => {
    const res = await request(app.getHttpServer())
      .post(`/matches/${matchId}/commentary`)
      .send(validBody)
      .expect(201);

    expect(res.body.data).toMatchObject({
      matchId,
      message: validBody.message,
      period: "2nd half",
      tags: ["goal", "shot"],
      metadata: { assist: "Sam Kerr" },
    });
    expect(res.body.data.id).toBeDefined();
  });

  it("returns 404 when the match does not exist", () =>
    request(app.getHttpServer()).post(`/matches/999999/commentary`).send(validBody).expect(404));

  it("returns 400 when message is missing", () =>
    request(app.getHttpServer())
      .post(`/matches/${matchId}/commentary`)
      .send({ minute: 1 })
      .expect(400));

  it("returns 400 for unknown extra fields", () =>
    request(app.getHttpServer())
      .post(`/matches/${matchId}/commentary`)
      .send({ ...validBody, hacker: "x" })
      .expect(400));

  it("returns 400 for a non-numeric match id", () =>
    request(app.getHttpServer()).post(`/matches/abc/commentary`).send(validBody).expect(400));
});

describe("GET /matches/:id/commentary", () => {
  const seed = (n: number, ms = (i: number) => new Date(2020, 0, 1, 0, 0, i)) =>
    testDb.insert(commentary).values(
      Array.from({ length: n }, (_, i) => ({
        matchId,
        message: `msg ${i}`,
        createdAt: ms(i),
      }))
    );

  it("lists commentary for the match", async () => {
    await seed(3);
    const res = await request(app.getHttpServer())
      .get(`/matches/${matchId}/commentary`)
      .expect(200);
    expect(res.body.data).toHaveLength(3);
  });

  it("only returns commentary for the requested match", async () => {
    await seed(2);
    const [other] = await testDb
      .insert(matches)
      .values({ sport: "football", homeTeam: "C", awayTeam: "D" })
      .returning();
    await testDb.insert(commentary).values({ matchId: other.id, message: "other" });

    const res = await request(app.getHttpServer())
      .get(`/matches/${matchId}/commentary`)
      .expect(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("defaults to 10 results", async () => {
    await seed(12);
    const res = await request(app.getHttpServer())
      .get(`/matches/${matchId}/commentary`)
      .expect(200);
    expect(res.body.data).toHaveLength(10);
  });

  it("respects the limit query", async () => {
    await seed(8);
    const res = await request(app.getHttpServer())
      .get(`/matches/${matchId}/commentary?limit=5`)
      .expect(200);
    expect(res.body.data).toHaveLength(5);
  });

  it("returns 400 when limit exceeds 100", () =>
    request(app.getHttpServer()).get(`/matches/${matchId}/commentary?limit=101`).expect(400));

  it("orders by createdAt descending", async () => {
    await seed(3);
    const res = await request(app.getHttpServer())
      .get(`/matches/${matchId}/commentary`)
      .expect(200);
    const times = res.body.data.map((c: { createdAt: string }) => new Date(c.createdAt).getTime());
    expect(times[0]).toBeGreaterThan(times[times.length - 1]);
  });
});
