import { PGlite } from "@electric-sql/pglite";
import { INestApplication } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import { Test } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { DB } from "../src/db/db.provider";

const validBody = {
  sport: "football",
  homeTeam: "A",
  awayTeam: "B",
  startTime: "2099-01-01T18:00:00Z",
  endTime: "2099-01-01T20:00:00Z",
};

let client: PGlite;
let app: INestApplication;

beforeAll(async () => {
  client = new PGlite();
  const testDb = drizzle(client);
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

it("POST /matches returns 201 and persists the match", async () => {
  const res = await request(app.getHttpServer()).post("/matches").send(validBody).expect(201);
  expect(res.body.data).toMatchObject({ sport: "football", status: "scheduled" });
  expect(res.body.data.id).toBeDefined();

  const list = await request(app.getHttpServer()).get("/matches").expect(200);
  expect(list.body.data).toHaveLength(1);
});

it("POST /matches returns 400 for an invalid body (endTime before startTime)", () =>
  request(app.getHttpServer())
    .post("/matches")
    .send({ ...validBody, startTime: validBody.endTime, endTime: validBody.startTime })
    .expect(400));

it("POST /matches returns 400 for unknown extra fields", () =>
  request(app.getHttpServer())
    .post("/matches")
    .send({ ...validBody, hacker: "x" })
    .expect(400));
