import { migrateSelfReportsToVault } from "../selfReports/selfReportStorage";
import { migrateDraftsToVault } from "../editor/draftRepository";
import { migrateEntriesToVault } from "../entries/localEntryRepository";

export async function migrateLocalDataToVault() {
  await migrateEntriesToVault();
  await migrateDraftsToVault();
  await migrateSelfReportsToVault();
}
