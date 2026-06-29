import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
import { AuthModule } from "@thallesp/nestjs-better-auth";

import { AppController } from "./app.controller";
import { auth } from "./auth";
import { dbProvider } from "./db/db.provider";
import { CommentaryController } from "./routes/commentary/commentary.controller";
import { CommentaryService } from "./routes/commentary/commentary.service";
import { MatchesController } from "./routes/matches/matches.controller";
import { MatchesService } from "./routes/matches/matches.service";
import { MatchesGateway } from "./ws/matches.gateway";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Mounts /api/auth/* and registers a global AuthGuard.
    // All routes are protected unless marked @AllowAnonymous().
    // Guard is disabled under test: better-auth binds to the real DB at import,
    // so e2e suites (which run against an in-memory PGlite) can't authenticate.
    AuthModule.forRoot({ auth, disableGlobalAuthGuard: process.env.NODE_ENV === "test" }),
  ],
  controllers: [AppController, MatchesController, CommentaryController],
  providers: [
    MatchesService,
    CommentaryService,
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
