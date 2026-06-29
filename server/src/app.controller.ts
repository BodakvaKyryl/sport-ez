import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

@Controller()
export class AppController {
  @AllowAnonymous()
  @Get()
  getRoot(): string {
    return "sport-ez API is running";
  }
}
