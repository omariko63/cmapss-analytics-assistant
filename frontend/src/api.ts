import axios from "axios";

export interface CycleLengthStats {
  min: number;
  median: number;
  max: number;
}

export interface SensorCorrelation {
  feature: string;
  rul_correlation: number;
}

export interface InformativeSensor {
  feature: string;
  informativeness_score: number;
}

export interface DatasetMetadata {
  dataset_id: string;
  source: string;
  fault_mode: string;
  operating_conditions: string;
  train_rows: number;
  test_rows: number;
  train_engines: number;
  test_engines: number;
  columns: string[];
  train_cycle_length: CycleLengthStats;
  test_cycle_length: CycleLengthStats;
  test_rul: CycleLengthStats;
  constant_features: string[];
  near_constant_features: string[];
  top_negative_rul_correlations: SensorCorrelation[];
  top_positive_rul_correlations: SensorCorrelation[];
  top_informative_sensors: InformativeSensor[];
  stable_sensors: string[];
}

export interface EngineDriftSensor {
  feature: string;
  early_mean: number;
  late_mean: number;
  absolute_drift: number;
  normalized_drift: number;
  direction: string;
}

export interface EngineSummary {
  dataset_id: string;
  engine_id: number;
  cycles_recorded: number;
  starting_rul: number;
  ending_rul: number;
  early_window_size: number;
  late_window_size: number;
  top_drifting_sensors: EngineDriftSensor[];
  degradation_onset_cycle: number;
  degradation_onset_fraction: number;
  degradation_onset_stage: string;
}

export interface NlpParsed {
  original: string;
  tokens: string[];
  filtered: string[];
  lemmas: string[];
  unit_ids: number[];
  dataset_ids: string[];
  intent: string;
  split: string;
}

export interface NlpResponse {
  parsed: NlpParsed;
  llm_available: boolean;
  answer: string | null;
  structured_context: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function fetchMetadata(
  datasetId = "fd001",
): Promise<DatasetMetadata> {
  const res = await axios.get<DatasetMetadata>(
    `/api/v1/datasets/${datasetId}/metadata`,
  );
  return res.data;
}

export async function fetchEngineSummary(
  datasetId: string,
  engineId: number,
): Promise<EngineSummary> {
  const res = await axios.get<EngineSummary>(
    `/api/v1/datasets/${datasetId}/engines/${engineId}`,
  );
  return res.data;
}

export async function sendMessage(
  message: string,
  context?: string,
): Promise<NlpResponse> {
  const res = await axios.post<NlpResponse>("/api/v1/nlp/process", {
    message,
    context: context ?? null,
  });
  return res.data;
}

export interface Suggestion {
  text: string;
  category: string;
}

export interface SuggestionResponse {
  suggestions: Suggestion[];
}

export async function fetchSuggestions(
  query: string,
  limit = 8,
): Promise<Suggestion[]> {
  if (query.length < 2) return [];
  const res = await axios.get<SuggestionResponse>("/api/v1/suggestions", {
    params: { q: query, limit },
  });
  return res.data.suggestions;
}
