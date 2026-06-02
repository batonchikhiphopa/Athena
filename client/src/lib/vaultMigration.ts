import { migrateSelfReportsToVault } from "../features/selfReports/selfReportStorage";
import { migrateLocalStorageToVault } from "./storage";

export async function migrateLocalDataToVault() {
  await migrateLocalStorageToVault();
  await migrateSelfReportsToVault();
}
