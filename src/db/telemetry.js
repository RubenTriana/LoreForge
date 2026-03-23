import { db } from './db';

/**
 * Logs AI token usage to the database for the Nexus Dashboard.
 * 
 * @param {string} module - The name of the module that triggered the AI call (e.g., 'Personajes', 'Lore', 'Escribanía').
 * @param {number} promptTokens - Number of tokens in the prompt.
 * @param {number} completionTokens - Number of tokens in the completion.
 * @param {string} action - Specific action description (e.g., 'Generar Retrato', 'Analizar Trama').
 */
export async function logTokenUsage(module, promptTokens, completionTokens, action) {
  // Approximate pricing: $0.50 per 1M input tokens, $1.50 per 1M output tokens (standard GPT-4o style pricing)
  const inputCost = (promptTokens / 1_000_000) * 0.50;
  const outputCost = (completionTokens / 1_000_000) * 1.50;
  const totalCost = inputCost + outputCost;

  try {
    await db.token_logs.add({
      timestamp: new Date().toISOString(),
      module,
      promptTokens,
      completionTokens,
      cost: totalCost,
      action
    });
    console.log(`[Telemetry] Logged ${promptTokens + completionTokens} tokens for ${module} (${action})`);
  } catch (error) {
    console.error('[Telemetry] Failed to log token usage:', error);
  }
}
