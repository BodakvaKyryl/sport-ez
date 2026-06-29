import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { CreateMatchDto } from "../src/validation/matches";

it("rejects endTime before startTime", () => {
  const dto = plainToInstance(CreateMatchDto, {
    sport: "football",
    homeTeam: "A",
    awayTeam: "B",
    startTime: "2026-06-24T20:00:00Z",
    endTime: "2026-06-24T18:00:00Z",
  });
  expect(validateSync(dto)).not.toHaveLength(0);
});
