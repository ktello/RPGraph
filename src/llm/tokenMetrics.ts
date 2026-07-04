import type { LlmCallStats } from '../types';
import {
  defaultEstimatedTokenBytesPerToken,
  fixedTokenEstimateReservePercent,
} from '../workflow/defaults';

const utf8Encoder = new TextEncoder();

export function validTokenBytesPerToken(value?: number) {
  return Number.isFinite(value) && value !== undefined
    ? Math.min(8, Math.max(1, value))
    : defaultEstimatedTokenBytesPerToken;
}

export class TextMetricsApi {
  readonly bytesPerToken: number;

  constructor(
    bytesPerToken?: number,
    private readonly reservePercent = fixedTokenEstimateReservePercent,
  ) {
    this.bytesPerToken = validTokenBytesPerToken(bytesPerToken);
  }

  bytes(text: string) {
    return utf8Encoder.encode(text).byteLength;
  }

  measure(text: string) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const reserveMultiplier = 1 + this.reservePercent / 100;
    return {
      characters: text.length,
      words,
      tokens: Math.ceil(this.bytes(text) / this.bytesPerToken * reserveMultiplier),
    };
  }
}

export class PromptTokenCalibration {
  private requestBytes = 0;
  private inputTokens = 0;

  constructor(private readonly enabled: boolean) {}

  addAuthorizedPromptSample(prompt: string, stats: LlmCallStats) {
    if (!this.enabled || typeof stats.inputTokens !== 'number' || stats.inputTokens <= 0) {
      return;
    }
    this.requestBytes += utf8Encoder.encode(prompt).byteLength;
    this.inputTokens += stats.inputTokens;
  }

  result() {
    return this.inputTokens > 0
      ? validTokenBytesPerToken(this.requestBytes / this.inputTokens)
      : undefined;
  }
}
