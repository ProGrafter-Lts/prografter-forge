/**
 * Test / demo record detection.
 *
 * Dashboard aggregates (£ totals, counts, win rate) must never blend seeded
 * demo data with real trading data. A record counts as test if either the
 * record itself, or the job it belongs to, is flagged `is_test`.
 */
export interface TestFlaggable {
  is_test?: boolean | null;
  jobs?: { is_test?: boolean | null } | null;
}

export const isTestRecord = (row: TestFlaggable | null | undefined): boolean =>
  !!(row && (row.is_test === true || row.jobs?.is_test === true));

export const splitTestRecords = <T extends TestFlaggable>(rows: T[]) => ({
  real: rows.filter((r) => !isTestRecord(r)),
  test: rows.filter((r) => isTestRecord(r)),
});
