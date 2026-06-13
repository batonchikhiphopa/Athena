import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

function localDateOnly() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

test("editor flow saves a tagged entry with self-report and shows it in archive", async ({
  page,
}) => {
  const entryId = String(Date.now());
  const entryText = `Synthetic Phase 7 local search smoke entry ${entryId}`;
  const today = localDateOnly();

  await page.goto("/");

  const editor = page.getByTestId("editor-textarea");
  await expect(editor).toBeVisible();
  await editor.click();
  await editor.pressSequentially(`${entryText} #portfolio `);
  await expect(page.getByTestId("editor-tag-chip")).toContainText("#portfolio");

  await page.getByTestId("editor-self-report").click();
  await expect(page.getByTestId("self-report-menu")).toBeVisible();
  const moodSlider = page.getByTestId("self-report-slider-mood");
  await moodSlider.focus();
  await moodSlider.press("ArrowRight");
  await moodSlider.press("ArrowRight");
  await page.getByTestId("editor-textarea").click();

  await page.waitForTimeout(1200);

  await page.getByTestId("nav-entries").click();
  const savedEntry = page
    .getByTestId("entry-list-item")
    .filter({ hasText: entryId });

  await expect(savedEntry).toBeVisible();
  await expect(savedEntry).toContainText("#portfolio");

  const searchInput = page.getByTestId("entries-search-input");

  await searchInput.fill(entryId);
  await expect(savedEntry).toBeVisible();

  await searchInput.fill(today);
  await expect(savedEntry).toBeVisible();

  await searchInput.fill("1900-01-01");
  await expect(page.getByTestId("entries-empty-state")).toBeVisible();

  await page.getByTestId("entries-clear-filters").click();
  await expect(savedEntry).toBeVisible();

  await savedEntry.getByTestId("entry-tile-tag-portfolio").click();
  await expect(page.getByTestId("entry-tag-include-portfolio")).toBeVisible();
  await expect(savedEntry).toBeVisible();

  await page.getByTestId("entries-clear-filters").click();
  await expect(savedEntry).toBeVisible();

  await searchInput.fill("-#portfolio");
  await expect(savedEntry).toHaveCount(0);
  await expect(page.getByTestId("entries-empty-state")).toBeVisible();

  await page.getByTestId("entries-clear-filters").click();
  await expect(savedEntry).toBeVisible();

  await expect
    .poll(
      async () => {
        const response = await page.request.get(
          `/self-reports/daily-aggregates/${today}`,
        );
        const body = (await response.json()) as {
          aggregates: Array<{ axis: string; count: number }>;
        };

        return body.aggregates.some(
          (aggregate) => aggregate.axis === "mood" && aggregate.count >= 1,
        );
      },
      { timeout: 10_000 },
    )
    .toBe(true);

  const metadataResponse = await page.request.get("/exports/backend-metadata");
  expect(metadataResponse.ok()).toBe(true);
  expect(await metadataResponse.text()).not.toContain(entryText);

  await page.getByTestId("nav-settings").click();
  await page.getByTestId("settings-tab-data").click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("settings-data-export").click();
  const download = await downloadPromise;
  const exportPath = await download.path();

  expect(download.suggestedFilename()).toMatch(/^athena-local-export-.*\.json$/);
  expect(exportPath).toBeTruthy();

  const exportJson = await readFile(exportPath!, "utf8");
  const exportPackage = JSON.parse(exportJson) as {
    export_version: string;
    entries: Array<{ text: string }>;
  };

  expect(exportPackage.export_version).toBe("local_export.v1");
  expect(
    exportPackage.entries.some((entry) => entry.text.includes(entryText)),
  ).toBe(true);

  await page.getByTestId("settings-data-import-file").setInputFiles(exportPath!);
  await expect(page.getByTestId("settings-data-import-preview")).toBeVisible();

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByTestId("settings-data-import-apply").click();
  await expect(page.getByTestId("settings-data-import-result")).toBeVisible();

  await page.getByTestId("nav-entries").click();
  await searchInput.fill(entryId);
  await expect(savedEntry).toBeVisible();
});
