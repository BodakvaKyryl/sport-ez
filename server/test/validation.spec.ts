import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { CreateMatchDto, ListMatchesQueryDto, MatchIdParamDto } from "../src/validation/matches";

const errorsFor = (cls: any, obj: unknown) => validateSync(plainToInstance(cls, obj));

const validCreate = {
  sport: "football",
  homeTeam: "A",
  awayTeam: "B",
  startTime: "2099-01-01T18:00:00Z",
  endTime: "2099-01-01T20:00:00Z",
};

describe("CreateMatchDto", () => {
  it("accepts a valid payload", () => {
    expect(errorsFor(CreateMatchDto, validCreate)).toHaveLength(0);
  });

  it("rejects endTime before startTime", () => {
    expect(
      errorsFor(CreateMatchDto, {
        ...validCreate,
        startTime: "2099-01-01T20:00:00Z",
        endTime: "2099-01-01T18:00:00Z",
      })
    ).not.toHaveLength(0);
  });

  it("rejects an empty sport", () => {
    expect(errorsFor(CreateMatchDto, { ...validCreate, sport: "" })).not.toHaveLength(0);
  });

  it("rejects a non-ISO startTime", () => {
    expect(errorsFor(CreateMatchDto, { ...validCreate, startTime: "not-a-date" })).not.toHaveLength(
      0
    );
  });

  it("rejects a negative score", () => {
    expect(errorsFor(CreateMatchDto, { ...validCreate, homeScore: -1 })).not.toHaveLength(0);
  });

  it("coerces a string score to a number", () => {
    const dto = plainToInstance(CreateMatchDto, { ...validCreate, homeScore: "5" });
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.homeScore).toBe(5);
  });
});

describe("ListMatchesQueryDto", () => {
  it("accepts an omitted limit", () => {
    expect(errorsFor(ListMatchesQueryDto, {})).toHaveLength(0);
  });

  it("coerces a string limit to a number", () => {
    const dto = plainToInstance(ListMatchesQueryDto, { limit: "10" });
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.limit).toBe(10);
  });

  it("rejects a limit above 100", () => {
    expect(errorsFor(ListMatchesQueryDto, { limit: "101" })).not.toHaveLength(0);
  });

  it("rejects a non-positive limit", () => {
    expect(errorsFor(ListMatchesQueryDto, { limit: "0" })).not.toHaveLength(0);
  });
});

describe("MatchIdParamDto", () => {
  it("coerces a string id to a number", () => {
    const dto = plainToInstance(MatchIdParamDto, { id: "5" });
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.id).toBe(5);
  });

  it("rejects a non-numeric id", () => {
    expect(errorsFor(MatchIdParamDto, { id: "abc" })).not.toHaveLength(0);
  });

  it("rejects a non-positive id", () => {
    expect(errorsFor(MatchIdParamDto, { id: "-1" })).not.toHaveLength(0);
  });
});
