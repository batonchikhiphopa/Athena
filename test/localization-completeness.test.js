import assert from "node:assert/strict";
import { test } from "node:test";

import { messages } from "../client/src/i18n/messages.ts";
import { createDemoActivities } from "../client/src/features/results/demoResults.ts";
import { getResultsCopy } from "../client/src/features/results/resultsCopy.ts";
import { getResultsCorrectionCopy } from "../client/src/features/results/resultsCorrectionCopy.ts";

test("Results correction copy has explicit non-English operational labels", () => {
  const en = getResultsCorrectionCopy("en");
  const keys = [
    "add",
    "addAliasOrTag",
    "aliasPlaceholder",
    "cancel",
    "chooseEpisodeEvent",
    "chooseTag",
    "confidence",
    "emptySources",
    "event",
    "manualLink",
    "pendingIntro",
    "priority",
    "remove",
    "save",
    "sources",
  ];

  for (const language of ["de", "ru", "uk"]) {
    const copy = getResultsCorrectionCopy(language);

    for (const key of keys) {
      assert.notEqual(
        copy[key],
        en[key],
        `${language}.${key} should not fall back to English`,
      );
    }

    assert.notDeepEqual(copy.status, en.status);
    assert.notDeepEqual(copy.eventLabel, en.eventLabel);
    assert.notDeepEqual(copy.kind, en.kind);
  }
});

test("Results snapshot and demo text follow the selected language", () => {
  assert.equal(getResultsCopy("de").snapshotMentions, "Erwähnungen");
  assert.equal(getResultsCopy("ru").snapshotMentions, "Упоминаний");
  assert.equal(getResultsCopy("uk").snapshotMentions, "Згадок");

  const deDemoText = createDemoActivities("de")
    .flatMap((activity) => activity.mentions.map((mention) => mention.text))
    .join("\n");
  const ukDemoText = createDemoActivities("uk")
    .flatMap((activity) => activity.mentions.map((mention) => mention.text))
    .join("\n");

  assert.match(deDemoText, /geprüft|zurückgekehrt|geschrieben/);
  assert.doesNotMatch(deDemoText, /Разобрал|Reviewed/);
  assert.match(ukDemoText, /Розібрав|Повернувся|писав/);
  assert.doesNotMatch(ukDemoText, /Reviewed|Разобрал/);
});

test("new shared UI copy is localized outside English", () => {
  assert.equal(messages.de["settings.access.profileDefaultName"], "Profil {number}");
  assert.equal(messages.ru["provider.ollama"], "Локальная Ollama (сначала приватность)");
  assert.equal(messages.uk["settings.records.queueNextRetry"], "Наступна спроба");
  assert.equal(messages.de["debug.copy"], "Debug-Info kopieren");
});
