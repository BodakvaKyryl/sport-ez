import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";

import { AppController } from "./app.controller";
import { dbProvider } from "./db/db.provider";
import { MatchesController } from "./routes/matches.controller";
import { MatchesService } from "./routes/matches.service";
import { MatchesGateway } from "./ws/matches.gateway";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, MatchesController],
  providers: [
    MatchesService,
    MatchesGateway,
    dbProvider,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
