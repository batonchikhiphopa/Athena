export type AthenaPhraseTime = "morning" | "day" | "evening" | "night" | "any";

export type AthenaPhraseTone = "quiet" | "strategic" | "bold" | "empathetic";

export type AthenaPhrase = {
  id: string;
  text: string;
  times?: AthenaPhraseTime[];
  tone?: AthenaPhraseTone;
};

export type AthenaPhraseLibrary = {
  greetings: AthenaPhrase[];
  cta: AthenaPhrase[];
};
