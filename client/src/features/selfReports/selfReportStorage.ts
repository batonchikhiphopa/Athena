import {
  openAthenaLocalDb,
  SELF_REPORT_DAILY_AGGREGATES_STORE,
  SELF_REPORT_STORE,
} from "../../platform/storage/athenaDb";
import {
  decryptVaultJson,
  encryptVaultJson,
  isVaultEncryptedPayload,
  type VaultEncryptedPayload,
} from "../vault/vaultApi";
import {
  DEFAULT_SELF_REPORT_VALUES,
  SELF_REPORT_AXES,
  SELF_REPORT_DAILY_AGGREGATE_VERSION,
  SELF_REPORT_SCHEMA_VERSION,
  type SelfReportAxis,
  type SelfReportDailyAggregate,
  type SelfReportEvent,
  type SelfReportValues,
} from "./selfReportTypes";

type SaveEntrySelfReportInput = {
  entryId: string;
  localDay: string;
  values: SelfReportValues;
};

type EncryptedSelfReportEventRecord = {
  id: string;
  entry_id: string;
  local_day: string;
  updated_at: string;
  vault_version: 1;
  vault_payload: VaultEncryptedPayload;
};

type StoredSelfReportEventRecord =
  | SelfReportEvent
  | EncryptedSelfReportEventRecord;

type EncryptedSelfReportDailyAggregateRecord = {
  id: string;
  local_day: string;
  axis: SelfReportAxis;
  updated_at: string;
  vault_version: 1;
  vault_payload: VaultEncryptedPayload;
};

type StoredSelfReportDailyAggregateRecord =
  | SelfReportDailyAggregate
  | EncryptedSelfReportDailyAggregateRecord;

export type ReplaceSelfReportEventsResult = {
  events: SelfReportEvent[];
  aggregates: SelfReportDailyAggregate[];
  recomputedDays: string[];
};

export async function getEntrySelfReport(entryId: string) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(SELF_REPORT_STORE, "readonly");
  const index = transaction.objectStore(SELF_REPORT_STORE).index("entry_id");
  const report = await idbRequest<StoredSelfReportEventRecord | undefined>(
    index.get(entryId),
  );

  return report
    ? normalizeSelfReportEvent(await readStoredSelfReportEvent(report))
    : null;
}

export async function saveEntrySelfReport({
  entryId,
  localDay,
  values,
}: SaveEntrySelfReportInput) {
  const existing = await getEntrySelfReport(entryId);
  const now = new Date().toISOString();
  const nextReport: SelfReportEvent = {
    id: existing?.id ?? `self-report:${entryId}`,
    entry_id: entryId,
    local_day: localDay,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    values: normalizeSelfReportValues(values),
    schema_version: SELF_REPORT_SCHEMA_VERSION,
    sync_status: "pending_sync",
  };

  const affectedDays = Array.from(
    new Set([existing?.local_day, localDay].filter(Boolean) as string[]),
  );
  const encryptedReport = await encryptSelfReportEvent(nextReport);
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(SELF_REPORT_STORE, "readwrite");

  await idbRequest(transaction.objectStore(SELF_REPORT_STORE).put(encryptedReport));

  for (const affectedDay of affectedDays) {
    await recomputeSelfReportDailyAggregates(affectedDay);
  }

  return nextReport;
}

export async function deleteEntrySelfReport(entryId: string) {
  const existing = await getEntrySelfReport(entryId);
  if (!existing) return null;

  const db = await openAthenaLocalDb();
  const transaction = db.transaction(SELF_REPORT_STORE, "readwrite");

  await idbRequest(transaction.objectStore(SELF_REPORT_STORE).delete(existing.id));
  await recomputeSelfReportDailyAggregates(existing.local_day);

  return existing;
}

export async function replaceAllSelfReportEvents(
  events: SelfReportEvent[],
): Promise<ReplaceSelfReportEventsResult> {
  const normalizedEvents = events.map(normalizeSelfReportEvent);
  const encryptedEvents = await Promise.all(
    normalizedEvents.map(encryptSelfReportEvent),
  );
  const recomputedDays = Array.from(
    new Set(normalizedEvents.map((event) => event.local_day)),
  ).sort();

  const db = await openAthenaLocalDb();
  const transaction = db.transaction(
    [SELF_REPORT_STORE, SELF_REPORT_DAILY_AGGREGATES_STORE],
    "readwrite",
  );

  await idbRequest(transaction.objectStore(SELF_REPORT_STORE).clear());
  await idbRequest(
    transaction.objectStore(SELF_REPORT_DAILY_AGGREGATES_STORE).clear(),
  );

  const selfReportStore = transaction.objectStore(SELF_REPORT_STORE);

  for (const event of encryptedEvents) {
    await idbRequest(selfReportStore.put(event));
  }

  const aggregateGroups = await Promise.all(
    recomputedDays.map((localDay) => recomputeSelfReportDailyAggregates(localDay)),
  );

  return {
    events: normalizedEvents,
    aggregates: aggregateGroups.flat(),
    recomputedDays,
  };
}

export async function getSelfReportDailyAggregates(localDay: string) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(
    SELF_REPORT_DAILY_AGGREGATES_STORE,
    "readonly",
  );
  const index = transaction
    .objectStore(SELF_REPORT_DAILY_AGGREGATES_STORE)
    .index("local_day");
  const aggregates = await idbRequest<StoredSelfReportDailyAggregateRecord[]>(
    index.getAll(localDay),
  );
  const decryptedAggregates = await Promise.all(
    aggregates.map(readStoredSelfReportDailyAggregate),
  );

  return decryptedAggregates
    .map(normalizeSelfReportDailyAggregate)
    .sort((left, right) => left.axis.localeCompare(right.axis));
}

export async function markSelfReportsForLocalDaySynced(
  localDay: string,
  syncedThrough = new Date().toISOString(),
) {
  const reports = await getSelfReportsForLocalDay(localDay);
  const reportsToUpdate = reports.filter(
    (report) =>
      report.sync_status !== "synced" && report.updated_at <= syncedThrough,
  );

  if (reportsToUpdate.length === 0) return 0;

  const encryptedReports = await Promise.all(
    reportsToUpdate.map((report) =>
      encryptSelfReportEvent({
        ...report,
        sync_status: "synced",
      }),
    ),
  );
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(SELF_REPORT_STORE, "readwrite");
  const store = transaction.objectStore(SELF_REPORT_STORE);

  for (const encryptedReport of encryptedReports) {
    await idbRequest(store.put(encryptedReport));
  }

  return encryptedReports.length;
}

export async function recomputeSelfReportDailyAggregates(localDay: string) {
  const reports = await getSelfReportsForLocalDay(localDay);
  const nextAggregates = SELF_REPORT_AXES.map((axis) =>
    buildAxisAggregate(localDay, axis, reports),
  ).filter((aggregate): aggregate is SelfReportDailyAggregate => Boolean(aggregate));

  const db = await openAthenaLocalDb();
  const transaction = db.transaction(
    SELF_REPORT_DAILY_AGGREGATES_STORE,
    "readwrite",
  );
  const store = transaction.objectStore(SELF_REPORT_DAILY_AGGREGATES_STORE);

  for (const axis of SELF_REPORT_AXES) {
    await idbRequest(store.delete(createAggregateId(localDay, axis)));
  }

  for (const aggregate of nextAggregates) {
    const encryptedAggregate = await encryptSelfReportDailyAggregate(aggregate);
    const writeTransaction = db.transaction(
      SELF_REPORT_DAILY_AGGREGATES_STORE,
      "readwrite",
    );
    await idbRequest(
      writeTransaction
        .objectStore(SELF_REPORT_DAILY_AGGREGATES_STORE)
        .put(encryptedAggregate),
    );
  }

  return nextAggregates;
}

export async function getAllSelfReportEvents() {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(SELF_REPORT_STORE, "readonly");
  const reports = await idbRequest<StoredSelfReportEventRecord[]>(
    transaction.objectStore(SELF_REPORT_STORE).getAll(),
  );

  const decryptedReports = await Promise.all(
    reports.map((report) => readStoredSelfReportEvent(report)),
  );

  return decryptedReports
    .map(normalizeSelfReportEvent)
    .sort((left, right) => left.created_at.localeCompare(right.created_at));
}

async function getSelfReportsForLocalDay(localDay: string) {
  const db = await openAthenaLocalDb();
  const transaction = db.transaction(SELF_REPORT_STORE, "readonly");
  const index = transaction.objectStore(SELF_REPORT_STORE).index("local_day");
  const reports = await idbRequest<StoredSelfReportEventRecord[]>(
    index.getAll(localDay),
  );

  const decryptedReports = await Promise.all(
    reports.map((report) => readStoredSelfReportEvent(report)),
  );

  return decryptedReports.map(normalizeSelfReportEvent);
}

export async function migrateSelfReportsToVault() {
  const db = await openAthenaLocalDb();

  await migrateSelfReportEventsToVault(db);
  await migrateSelfReportDailyAggregatesToVault(db);
}

function buildAxisAggregate(
  localDay: string,
  axis: SelfReportAxis,
  reports: SelfReportEvent[],
): SelfReportDailyAggregate | null {
  const values = reports
    .map((report) => report.values[axis])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (values.length === 0) return null;

  const sum = values.reduce((total, value) => total + value, 0);
  const sumSquares = values.reduce((total, value) => total + value * value, 0);

  return {
    id: createAggregateId(localDay, axis),
    local_day: localDay,
    axis,
    count: values.length,
    sum,
    sum_squares: sumSquares,
    mean: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    schema_version: SELF_REPORT_SCHEMA_VERSION,
    aggregate_version: SELF_REPORT_DAILY_AGGREGATE_VERSION,
    updated_at: new Date().toISOString(),
  };
}

function createAggregateId(localDay: string, axis: SelfReportAxis) {
  return `${localDay}:${axis}`;
}

function normalizeSelfReportEvent(report: SelfReportEvent): SelfReportEvent {
  return {
    ...report,
    values: normalizeSelfReportValues(report.values),
    schema_version: SELF_REPORT_SCHEMA_VERSION,
    sync_status: report.sync_status ?? "local_only",
  };
}

function normalizeSelfReportDailyAggregate(
  aggregate: SelfReportDailyAggregate,
): SelfReportDailyAggregate {
  return {
    ...aggregate,
    schema_version: SELF_REPORT_SCHEMA_VERSION,
    aggregate_version: SELF_REPORT_DAILY_AGGREGATE_VERSION,
  };
}

function normalizeSelfReportValues(values: SelfReportValues): SelfReportValues {
  return SELF_REPORT_AXES.reduce<SelfReportValues>(
    (result, axis) => ({
      ...result,
      [axis]: clampSelfReportValue(values[axis]),
    }),
    { ...DEFAULT_SELF_REPORT_VALUES },
  );
}

function clampSelfReportValue(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;

  return Math.max(0, Math.min(10, Math.round(value)));
}

async function migrateSelfReportEventsToVault(db: IDBDatabase) {
  const transaction = db.transaction(SELF_REPORT_STORE, "readonly");
  const records = await idbRequest<StoredSelfReportEventRecord[]>(
    transaction.objectStore(SELF_REPORT_STORE).getAll(),
  );

  for (const record of records) {
    if (isEncryptedSelfReportEventRecord(record)) continue;

    const encryptedRecord = await encryptSelfReportEvent(record);
    const writeTransaction = db.transaction(SELF_REPORT_STORE, "readwrite");
    await idbRequest(
      writeTransaction.objectStore(SELF_REPORT_STORE).put(encryptedRecord),
    );
  }
}

async function migrateSelfReportDailyAggregatesToVault(db: IDBDatabase) {
  const transaction = db.transaction(
    SELF_REPORT_DAILY_AGGREGATES_STORE,
    "readonly",
  );
  const records = await idbRequest<StoredSelfReportDailyAggregateRecord[]>(
    transaction.objectStore(SELF_REPORT_DAILY_AGGREGATES_STORE).getAll(),
  );

  for (const record of records) {
    if (isEncryptedSelfReportDailyAggregateRecord(record)) continue;

    const encryptedRecord = await encryptSelfReportDailyAggregate(record);
    const writeTransaction = db.transaction(
      SELF_REPORT_DAILY_AGGREGATES_STORE,
      "readwrite",
    );
    await idbRequest(
      writeTransaction
        .objectStore(SELF_REPORT_DAILY_AGGREGATES_STORE)
        .put(encryptedRecord),
    );
  }
}

async function readStoredSelfReportEvent(
  record: StoredSelfReportEventRecord,
): Promise<SelfReportEvent> {
  if (!isEncryptedSelfReportEventRecord(record)) return record;

  return decryptVaultJson<SelfReportEvent>(
    record.vault_payload,
    createSelfReportVaultAssociatedData(record.id),
  );
}

async function readStoredSelfReportDailyAggregate(
  record: StoredSelfReportDailyAggregateRecord,
): Promise<SelfReportDailyAggregate> {
  if (!isEncryptedSelfReportDailyAggregateRecord(record)) return record;

  return decryptVaultJson<SelfReportDailyAggregate>(
    record.vault_payload,
    createSelfReportDailyAggregateVaultAssociatedData(record.id),
  );
}

async function encryptSelfReportEvent(
  report: SelfReportEvent,
): Promise<EncryptedSelfReportEventRecord> {
  return {
    id: report.id,
    entry_id: report.entry_id,
    local_day: report.local_day,
    updated_at: report.updated_at,
    vault_version: 1,
    vault_payload: await encryptVaultJson(
      report,
      createSelfReportVaultAssociatedData(report.id),
    ),
  };
}

async function encryptSelfReportDailyAggregate(
  aggregate: SelfReportDailyAggregate,
): Promise<EncryptedSelfReportDailyAggregateRecord> {
  return {
    id: aggregate.id,
    local_day: aggregate.local_day,
    axis: aggregate.axis,
    updated_at: aggregate.updated_at,
    vault_version: 1,
    vault_payload: await encryptVaultJson(
      aggregate,
      createSelfReportDailyAggregateVaultAssociatedData(aggregate.id),
    ),
  };
}

function isEncryptedSelfReportEventRecord(
  record: StoredSelfReportEventRecord,
): record is EncryptedSelfReportEventRecord {
  return (
    typeof record === "object" &&
    record !== null &&
    "vault_payload" in record &&
    isVaultEncryptedPayload(record.vault_payload)
  );
}

function isEncryptedSelfReportDailyAggregateRecord(
  record: StoredSelfReportDailyAggregateRecord,
): record is EncryptedSelfReportDailyAggregateRecord {
  return (
    typeof record === "object" &&
    record !== null &&
    "vault_payload" in record &&
    isVaultEncryptedPayload(record.vault_payload)
  );
}

function createSelfReportVaultAssociatedData(reportId: string) {
  return `athena:vault:self-report:${reportId}`;
}

function createSelfReportDailyAggregateVaultAssociatedData(aggregateId: string) {
  return `athena:vault:self-report-daily-aggregate:${aggregateId}`;
}

function idbRequest<T = unknown>(request: IDBRequest) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}
