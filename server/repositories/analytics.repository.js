export async function getEntriesWithSignalsInRange(db, { from, to }) {
  const rows = await db.all(`
    SELECT
      e.id AS entry_id,
      e.entry_date,
      e.status,
      es.topics,
      es.activities,
      es.markers,
      es.load,
      es.fatigue,
      es.focus,
      es.signal_quality,
      es.schema_version,
      es.prompt_version,
      es.model,
      es.override_id
    FROM entries e
    LEFT JOIN effective_signals es
      ON es.entry_id = e.id
    WHERE e.entry_date BETWEEN ? AND ?
    ORDER BY e.entry_date ASC, e.created_at ASC, e.id ASC
  `, [from, to]);

  return rows;
}
