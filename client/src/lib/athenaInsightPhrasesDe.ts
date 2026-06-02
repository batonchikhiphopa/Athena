import type { AthenaInsightTopic } from "./athenaInsightPhrasesTypes";

const ATHENA_INSIGHT_TEMPLATE_FRAMES_DE = [
  "In den letzten Einträgen tritt {subject} mit ruhiger Beharrlichkeit hervor.",
  "Das Muster deiner Notizen sammelt sich wieder um {subject}.",
  "Ich sehe, wie {subject} zu einem tragenden Faden deiner Tage wird.",
  "Die Spur ist leise, aber deutlich: {subject} verlangt nach Ordnung.",
  "Zwischen den Zeilen bildet sich eine klare Frage zu {subject}.",
  "Das Gewebe deiner Gedanken legt mehr Gewicht auf {subject}, als es zuerst scheint.",
  "Die wiederkehrenden Zeichen weisen auf {subject} als wichtigen Prüfstein hin.",
  "Der innere Plan sucht offenbar eine stabilere Form im Bereich {subject}.",
];

const ATHENA_INSIGHT_ADVICE_DE = [
  "Wähle einen kleinen, klaren Schritt für {subject}, und vollende ihn ohne Hast.",
  "Nimm eine unnötige Spannung aus diesem Bereich, damit der Faden wieder ruhig liegt.",
  "Prüfe zuerst das Fundament; alles Weitere darf danach geordnet wachsen.",
  "Versuche nicht, das ganze Gewebe auf einmal zu richten; beginne mit dem nächsten Knoten.",
  "Gib diesem Thema eine feste Grenze, damit es nicht den ganzen Tag beherrscht.",
  "Frage nüchtern, welche Ressource hier fehlt: Zeit, Ruhe, Mut, Klarheit oder Unterstützung.",
  "Lass Disziplin hier eine Form der Fürsorge sein, nicht der Härte.",
  "Kehre mit kühlem Blick zu {subject} zurück und notiere den nächsten sinnvollen Zug.",
];

type TopicSeed = {
  id: string;
  aliases: string[];
  subject: string;
};

function createTopic(seed: TopicSeed): AthenaInsightTopic {
  return {
    ...seed,
    templates: ATHENA_INSIGHT_TEMPLATE_FRAMES_DE,
    advice: ATHENA_INSIGHT_ADVICE_DE,
  };
}

export const ATHENA_INSIGHT_TOPICS_DE: AthenaInsightTopic[] = [
  createTopic({
    id: "health",
    aliases: ["gesundheit", "wohlbefinden", "körper", "health", "здоровье", "самочувствие", "тело"],
    subject: "körperliche Stimmigkeit",
  }),
  createTopic({
    id: "sleep",
    aliases: ["schlaf", "ruhe", "nacht", "sleep", "сон", "отдых", "ночь"],
    subject: "nächtliche Erholung",
  }),
  createTopic({
    id: "recovery",
    aliases: ["erholung", "regeneration", "reset", "recovery", "восстановление", "перезагрузка"],
    subject: "Rückkehr der Kräfte",
  }),
  createTopic({
    id: "fatigue",
    aliases: ["müdigkeit", "erschöpfung", "fatigue", "усталость", "истощение", "бессилие"],
    subject: "Last verbrauchter Energie",
  }),
  createTopic({
    id: "work",
    aliases: ["arbeit", "aufgaben", "karriere", "work", "работа", "задачи", "карьера"],
    subject: "Ordnung deiner Arbeit",
  }),
  createTopic({
    id: "focus",
    aliases: ["fokus", "aufmerksamkeit", "konzentration", "focus", "фокус", "внимание", "концентрация"],
    subject: "Zucht der Aufmerksamkeit",
  }),
  createTopic({
    id: "productivity",
    aliases: ["produktivität", "effizienz", "leistung", "productivity", "продуктивность", "дела", "эффективность"],
    subject: "ruhiges Vorankommen",
  }),
  createTopic({
    id: "learning",
    aliases: ["lernen", "studium", "fähigkeiten", "learning", "обучение", "учеба", "навыки"],
    subject: "Kunst des Lernens",
  }),
  createTopic({
    id: "relationships",
    aliases: ["beziehungen", "nähe", "partner", "relationships", "отношения", "близкие", "партнер"],
    subject: "gewählte Bindungen",
  }),
  createTopic({
    id: "family",
    aliases: ["familie", "eltern", "kinder", "family", "семья", "родители", "дети"],
    subject: "Wärme des eigenen Hauses",
  }),
  createTopic({
    id: "home",
    aliases: ["zuhause", "haushalt", "raum", "home", "дом", "быт", "пространство"],
    subject: "Ordnung deines Raumes",
  }),
  createTopic({
    id: "money",
    aliases: ["geld", "finanzen", "budget", "money", "деньги", "финансы", "бюджет"],
    subject: "materielle Standfestigkeit",
  }),
  createTopic({
    id: "uncertainty",
    aliases: ["unsicherheit", "ungewissheit", "angst", "uncertainty", "неопределенность", "неизвестность", "тревога"],
    subject: "unmarkierter Weg vor dir",
  }),
  createTopic({
    id: "conflict",
    aliases: ["konflikt", "streit", "uneinigkeit", "conflict", "конфликт", "спор", "несогласие"],
    subject: "Aufprall verschiedener Willen",
  }),
  createTopic({
    id: "social",
    aliases: ["soziales", "freunde", "kommunikation", "social", "общение", "друзья", "социум"],
    subject: "Feld der Begegnungen",
  }),
  createTopic({
    id: "creativity",
    aliases: ["kreativität", "ideen", "inspiration", "creativity", "творчество", "идеи", "вдохновение"],
    subject: "Formgebung deiner Ideen",
  }),
  createTopic({
    id: "exercise",
    aliases: ["bewegung", "sport", "aktivität", "exercise", "движение", "спорт", "активность"],
    subject: "verkörperte Stärke",
  }),
  createTopic({
    id: "travel",
    aliases: ["reise", "weg", "unterwegssein", "travel", "поездки", "дорога", "путешествие"],
    subject: "Wege jenseits des Gewohnten",
  }),
  createTopic({
    id: "planning",
    aliases: ["planung", "pläne", "zukunft", "ziele", "planning", "планы", "будущее", "цели"],
    subject: "strategische Ausrichtung",
  }),
  createTopic({
    id: "emotions",
    aliases: ["emotionen", "gefühle", "zustand", "emotions", "эмоции", "чувства", "состояние"],
    subject: "Bewegung des Inneren",
  }),
];
