import { MATCH_STATUS, MatchStatus } from "../validation/matches";

type DateInput = string | Date | null | undefined;

export interface SyncableMatch {
  startTime: Date | null;
  endTime: Date | null;
  status: MatchStatus;
}

export function getMatchStatus(
  startTime: DateInput,
  endTime: DateInput,
  now: Date = new Date()
): MatchStatus | null {
  if (startTime == null || endTime == null) {
    return null;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (now < start) return MATCH_STATUS.SCHEDULED;

  if (now > end) return MATCH_STATUS.FINISHED;

  return MATCH_STATUS.LIVE;
}

export async function syncMatchesStatus(
  match: SyncableMatch,
  updateStatus: (status: MatchStatus) => Promise<void>
): Promise<MatchStatus> {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);

  if (!nextStatus) return match.status;

  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }

  return match.status;
}
