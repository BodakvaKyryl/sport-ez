import { PGlite } from "@electric-sql/pglite";
import { INestApplication } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import { Test } from "@nestjs/testing";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import request from "supertest";
import { WebSocket } from "ws";

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
let ws: WebSocket;

const nextMessage = () =>
  new Promise<any>((resolve) => ws.once("message", (d) => resolve(JSON.parse(d.toString()))));

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
  await app.listen(0);
});

afterAll(async () => {
  ws?.close();
  await app.close();
  await client.close();
});

it("pushes welcome → match_created → score_updated → commentary_created over the wire", async () => {
  const { port } = app.getHttpServer().address();
  ws = new WebSocket(`ws://localhost:${port}/ws`);

  const welcome = nextMessage();
  await new Promise((resolve) => ws.on("open", resolve));
  expect(await welcome).toMatchObject({ type: "welcome" });

  const created = nextMessage();
  const post = await request(app.getHttpServer()).post("/matches").send(validBody).expect(201);
  expect(await created).toMatchObject({ type: "match_created" });

  const updated = nextMessage();
  await request(app.getHttpServer())
    .patch(`/matches/${post.body.data.id}/score`)
    .send({ homeScore: 2, awayScore: 1 })
    .expect(200);
  expect(await updated).toMatchObject({ type: "score_updated", data: { homeScore: 2 } });

  const subscribed = nextMessage();
  ws.send(JSON.stringify({ type: "subscribe", matchId: post.body.data.id }));
  expect(await subscribed).toMatchObject({ type: "subscribed", matchId: post.body.data.id });

  const commented = nextMessage();
  await request(app.getHttpServer())
    .post(`/matches/${post.body.data.id}/commentary`)
    .send({ message: "GOAL!", period: "2nd half" })
    .expect(201);
  expect(await commented).toMatchObject({
    type: "commentary_created",
    data: { message: "GOAL!" },
  });
});
