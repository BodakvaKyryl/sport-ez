import { NestFactory } from "@nestjs/core";
import { json } from "express";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json());
  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
bootstrap();
