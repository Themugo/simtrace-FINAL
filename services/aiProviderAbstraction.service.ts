export type AIProvider = "GEMINI" | "OPENAI" | "ANTHROPIC" | "LOCAL_LLM";

export interface AIProviderConfig {
  provider: AIProvider;
  modelName: string;
  maxTokens: number;
  temperature: number;
}

export class AIProviderAbstractionService {
  private static activeConfig: AIProviderConfig = {
    provider: "GEMINI",
    modelName: "gemini-2.5-flash-grounded",
    maxTokens: 2048,
    temperature: 0.2,
  };

  public static getActiveConfig(): AIProviderConfig {
    return this.activeConfig;
  }

  public static setProvider(config: Partial<AIProviderConfig>): AIProviderConfig {
    this.activeConfig = { ...this.activeConfig, ...config };
    return this.activeConfig;
  }
}
