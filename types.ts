export interface SubtitleItem {
  id: number;
  startTime: string;
  endTime: string;
  originalText: string;
  formattedText: string | null;
}

export interface ParseResult {
  data: SubtitleItem[];
  error?: string;
}
