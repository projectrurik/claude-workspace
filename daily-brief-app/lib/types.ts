export interface BriefItem {
  slot: number;
  slotName: string;
  found: boolean;
  title: string;
  url: string;
  outlet: string;
  sourceType: string;
  published: string; // YYYY-MM-DD
  summary: string;
  whyRead: string;
  paywalled: boolean;
  preprint: boolean;
  dateEvidence: string;
  emptyReason?: string;
  generatedAt: string;
}

export interface DeepDiveTurn {
  question: string;
  answer: string;
  createdAt: string;
}

export interface DeepDive {
  date: string;
  slot: number;
  turns: DeepDiveTurn[];
}
