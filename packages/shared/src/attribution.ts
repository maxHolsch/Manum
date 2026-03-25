export interface AttributionSpan {
  start: number;
  end: number;
  color: 'green' | 'yellow' | 'red';
  confidence: number;
  scoring_mode: 'edit-distance' | 'llm-judge';
  paste_event_id?: string;
  original_paste_content?: string;
  edit_distance_from_paste?: number;
  matched_ai_entries?: {
    ai_message_id: string;
    overlap_score: number;
    method: string;
    ai_timestamp: number;
  }[];
  created_at: number;
  last_modified: number;
}

export type AttributionColor = AttributionSpan['color'];
export type ScoringMode = AttributionSpan['scoring_mode'];
