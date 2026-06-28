import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
import { AuthModule } from "@thallesp/nestjs-better-auth";

import { AppController } from "./app.controller";
import { auth } from "./auth";
import { dbProvider } from "./db/db.provider";
import { MatchesController } from "./routes/matches.controller";
import { MatchesService } from "./routes/matches.service";
import { MatchesGateway } from "./ws/matches.gateway";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Mounts /api/auth/* and registers a global AuthGuard.
    // All routes are protected unless marked @AllowAnonymous().
    AuthModule.forRoot({ auth }),
  ],
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
