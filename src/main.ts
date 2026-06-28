import { NestFactory } from "@nestjs/core";
import { WsAdapter } from "@nestjs/platform-ws";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.useWebSocketAdapter(new WsAdapter(app));

  const port = Number(process.env.PORT) || 8000;
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen(port, host);

  const baseUrl = host === "0.0.0.0" ? `http://localhost:${port}` : `http://${host}:${port}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WebSocket Server is running on ${baseUrl.replace("http", "ws")}/ws`);
}
bootstrap();
