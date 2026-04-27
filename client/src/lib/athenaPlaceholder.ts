import { ATHENA_LIBRARY } from './athenaPhrases';
import { pickPhrase } from "./phrasePicker";

type Phrase = {
  id: string;
  text: string;
  times?: string[];
  tone?: "quiet" | "strategic" | "bold" | "empathetic";
};

let lastWasCTA = false;

function weightByTone(phrases: Phrase[]) {
  const weighted: Phrase[] = [];

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

function getTimeBucket(hours: number) {
  if (hours < 6 || hours > 22) return "night";
  if (hours < 12) return "morning";
  if (hours > 18) return "evening";
  return "day";
}

function filterByTime(phrases: Phrase[], current: string) {
  return phrases.filter((p) => {
    if (!p.times || p.times.length === 0) return true;
    return p.times.includes(current) || p.times.includes("any");
  });
}

function pickGreetingWithSignals(
  phrases: Phrase[],
  signals: { fatigue?: number; load?: number; focus?: number }
) {
  const { fatigue = 0, load = 0, focus = 1 } = signals;

  let pool = phrases;

  if (fatigue > 0.7) {
    pool = phrases.filter(p => p.tone === "quiet" || p.tone === "empathetic");
  } else if (load > 0.7) {
    pool = phrases.filter(p => p.tone === "quiet");
  } else if (focus < 0.3) {
    pool = phrases.filter(p => p.tone === "quiet");
  }

  if (pool.length === 0) pool = phrases;

  return pickPhrase("greeting", pool);
}

function pickCTAWithSignals(
  phrases: Phrase[],
  signals: { fatigue?: number; load?: number; focus?: number }
) {
  const { fatigue = 0, load = 0, focus = 1 } = signals;

  let pool = phrases;

  if (fatigue > 0.7) {
    pool = phrases.filter(
      (p) => p.tone === "quiet" || p.tone === "empathetic"
    );
  } else if (load > 0.7) {
    pool = phrases.filter(
      (p) => p.tone === "quiet" || p.tone === "strategic"
    );
  } else if (focus < 0.3) {
    pool = phrases.filter((p) => p.tone === "quiet");
  }

  if (pool.length === 0) pool = phrases;

  // 🔧 ВЕСА
  const weighted = weightByTone(pool);

  return pickPhrase("cta", weighted);
}

export function generateAthenaPlaceholder(
  insights: { day?: string; week?: string; month?: string },
  signals: { fatigue?: number; load?: number; focus?: number } = {}
): string {
  const hours = new Date().getHours();
  const time = getTimeBucket(hours);

  // 1. Если есть инсайт — он главный
  if (insights.day) return insights.day;
  if (insights.week) return insights.week;
  if (insights.month) return insights.month;

  const CTA_PROBABILITY = 0.6;

  if (!lastWasCTA && Math.random() < CTA_PROBABILITY) {
    const ctaText = pickCTAWithSignals(ATHENA_LIBRARY.cta, signals);

    if (ctaText) {
      lastWasCTA = true;
      return ctaText;
    }
  }

  // если CTA не показали
  lastWasCTA = false;

  // 3. fallback → greeting
  const greetingPool = filterByTime(
    ATHENA_LIBRARY.greetings,
    time
  );

  if (greetingPool.length > 0) {
    return pickGreetingWithSignals(greetingPool, signals);  
  }
  return "";
}