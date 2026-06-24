import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { MatchesController } from "./routes/matches.controller";
import { MatchesService } from "./routes/matches.service";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, MatchesController],
  providers: [MatchesService],
})
export class AppModule {}
