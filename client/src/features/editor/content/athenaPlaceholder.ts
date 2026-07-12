import {
  DEFAULT_ATHENA_PHRASE_LANGUAGE,
  getAthenaPhraseLibrary,
  type AthenaPhraseLanguage,
} from "./athenaPhraseLibraries";
import type { AthenaPhrase, AthenaPhraseTime } from "./athenaPhrasesTypes";
import { pickPhrase } from "./phrasePicker";

let lastWasCTA = false;

function weightByTone(phrases: AthenaPhrase[]) {
  const weighted: AthenaPhrase[] = [];

  for (const p of phrases) {
    let weight = 1;

    if (p.tone === "quiet") weight = 3;
    else if (p.tone === "empathetic") weight = 2;
    else if (p.tone === "strategic") weight = 1.5;
    else if (p.tone === "bold") weight = 0.5;

    for (let i = 0; i < weight; i++) {
      weighted.push(p);
    }
  }

  return weighted;
}

function getTimeBucket(hours: number): AthenaPhraseTime {
  if (hours < 6 || hours > 22) return "night";
  if (hours < 12) return "morning";
  if (hours > 18) return "evening";
  return "day";
}

function filterByTime(phrases: AthenaPhrase[], current: AthenaPhraseTime) {
  return phrases.filter((p) => {
    if (!p.times || p.times.length === 0) return true;
    return p.times.includes(current) || p.times.includes("any");
  });
}

function pickGreetingWithSignals(
  phrases: AthenaPhrase[],
  signals: { fatigue?: number; load?: number; focus?: number },
  language: AthenaPhraseLanguage,
) {
  const { fatigue = 0, load = 0, focus = 1 } = signals;

  let pool = phrases;

  if (fatigue > 0.7) {
    pool = phrases.filter(
      (p) => p.tone === "quiet" || p.tone === "empathetic",
    );
  } else if (load > 0.7) {
    pool = phrases.filter((p) => p.tone === "quiet");
  } else if (focus < 0.3) {
    pool = phrases.filter((p) => p.tone === "quiet");
  }

  if (pool.length === 0) pool = phrases;

  return pickPhrase(`greeting:${language}`, pool);
}

function pickCTAWithSignals(
  phrases: AthenaPhrase[],
  signals: { fatigue?: number; load?: number; focus?: number },
  language: AthenaPhraseLanguage,
) {
  const { fatigue = 0, load = 0, focus = 1 } = signals;

  let pool = phrases;

  if (fatigue > 0.7) {
    pool = phrases.filter(
      (p) => p.tone === "quiet" || p.tone === "empathetic",
    );
  } else if (load > 0.7) {
    pool = phrases.filter(
      (p) => p.tone === "quiet" || p.tone === "strategic",
    );
  } else if (focus < 0.3) {
    pool = phrases.filter((p) => p.tone === "quiet");
  }

  if (pool.length === 0) pool = phrases;

  // 🔧 ВЕСА
  const weighted = weightByTone(pool);

  return pickPhrase(`cta:${language}`, weighted);
}

export function generateAthenaPlaceholder(
  insights: { day?: string; week?: string; month?: string },
  signals: { fatigue?: number; load?: number; focus?: number } = {},
  language: AthenaPhraseLanguage = DEFAULT_ATHENA_PHRASE_LANGUAGE,
): string {
  const hours = new Date().getHours();
  const time = getTimeBucket(hours);
  const library = getAthenaPhraseLibrary(language);

  // 1. Если есть инсайт — он главный
  if (insights.day) return insights.day;
  if (insights.week) return insights.week;
  if (insights.month) return insights.month;

  const CTA_PROBABILITY = 0.6;

  if (!lastWasCTA && Math.random() < CTA_PROBABILITY) {
    const ctaText = pickCTAWithSignals(library.cta, signals, language);

    if (ctaText) {
      lastWasCTA = true;
      return ctaText;
    }
  }

  // если CTA не показали
  lastWasCTA = false;

  // 3. fallback → greeting
  const greetingPool = filterByTime(library.greetings, time);

  if (greetingPool.length > 0) {
    return pickGreetingWithSignals(greetingPool, signals, language);
  }
  return "";
}
