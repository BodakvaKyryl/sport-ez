import { getMatchStatus } from "../src/utils/match-status";
import { MATCH_STATUS } from "../src/validation/matches";

describe("getMatchStatus", () => {
  const start = "2026-06-24T18:00:00Z";
  const end = "2026-06-24T20:00:00Z";

  it("scheduled before start", () =>
    expect(getMatchStatus(start, end, new Date("2026-06-24T17:00Z"))).toBe(MATCH_STATUS.SCHEDULED));
  it("live during window", () =>
    expect(getMatchStatus(start, end, new Date("2026-06-24T19:00Z"))).toBe(MATCH_STATUS.LIVE));
  it("finished after end", () =>
    expect(getMatchStatus(start, end, new Date("2026-06-24T21:00Z"))).toBe(MATCH_STATUS.FINISHED));
  it("null for an unparseable time", () => expect(getMatchStatus("nope", end)).toBeNull());
});
