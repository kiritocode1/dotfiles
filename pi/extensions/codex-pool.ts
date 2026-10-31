/**
 * Codex via CLIProxyAPI: both Plus grants pooled behind the local proxy.
 *
 * Auto-discovered from ~/.pi/agent/extensions. Select with:
 *   pi --provider codex-pool --model gpt-6-sol
 *
 * Why this exists: pi's built-in openai-codex provider holds a single OAuth
 * credential and talks straight to chatgpt.com, so it can only ever use one
 * account. Pointing a provider at the proxy instead gets session affinity and
 * failover across both grants.
 *
 * api is "openai-responses", not the "openai-codex-responses" the built-in
 * provider uses. That implementation parses a chatgpt_account_id out of the
 * OAuth JWT and fails with "Failed to extract accountId from token" when handed
 * a static proxy key. The proxy exposes a plain Responses endpoint at /v1, and
 * the Codex CLI reaches the same pool the same way (wire_api = "responses").
 *
 * apiKey reads $CPA_KEY, exported from ~/.zshenv. It is not inlined here
 * because this file sits under a directory that may end up in version control.
 *
 * Models mirror pi's own catalog exactly. gpt-5.4 and gpt-5.3-codex-spark are
 * left out: both return auth_unavailable on a Plus grant, on either account,
 * with cloaking on or off.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { openAIResponsesApi } from "@earendil-works/pi-ai";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("codex-pool", {
    name: "Codex via CLIProxyAPI",
    baseUrl: "http://127.0.0.1:8317/v1",
    apiKey: "$CPA_KEY",
    api: "openai-responses",
    streamSimple: (model, context, options) =>
      openAIResponsesApi().streamSimple(model, context, {
        ...options,
        // Request priority inference after other payload hooks have run.
        onPayload: async (payload, requestModel) => {
          const replacement = await options?.onPayload?.(payload, requestModel);
          const request = replacement === undefined ? payload : replacement;
          if (typeof request !== "object" || request === null || Array.isArray(request)) {
            throw new Error("Codex pool expects an object request payload");
          }
          return { ...request, service_tier: "priority" };
        },
      }),
    models: [
      {"id": "gpt-5.4-mini", "name": "GPT-5.4 mini", "reasoning": true, "input": ["text", "image"], "cost": {"input": 0.75, "output": 4.5, "cacheRead": 0.075, "cacheWrite": 0}, "contextWindow": 272000, "maxTokens": 128000, "thinkingLevelMap": {"xhigh": "xhigh", "minimal": "low"}, "compat": {"supportsOpenAIGrammarTools": true, "supportsToolSearch": true}},
      {"id": "gpt-5.5", "name": "GPT-5.5", "reasoning": true, "input": ["text", "image"], "cost": {"input": 5, "output": 30, "cacheRead": 0.5, "cacheWrite": 0, "tiers": [{"inputTokensAbove": 272000, "input": 10, "output": 45, "cacheRead": 1, "cacheWrite": 0}]}, "contextWindow": 272000, "maxTokens": 128000, "thinkingLevelMap": {"xhigh": "xhigh", "minimal": "low"}, "compat": {"supportsOpenAIGrammarTools": true, "supportsToolSearch": true}},
      {"id": "gpt-5.6-luna", "name": "GPT-5.6 Luna", "reasoning": true, "input": ["text", "image"], "cost": {"input": 0.2, "output": 1.2, "cacheRead": 0.02, "cacheWrite": 0.25, "tiers": [{"inputTokensAbove": 272000, "input": 0.4, "output": 1.8, "cacheRead": 0.04, "cacheWrite": 0.5}]}, "contextWindow": 272000, "maxTokens": 128000, "thinkingLevelMap": {"xhigh": "xhigh", "max": "max", "minimal": "low"}, "compat": {"supportsOpenAIGrammarTools": true, "supportsAdditionalTools": true, "supportsToolSearch": true}},
      {"id": "gpt-5.6-sol", "name": "GPT-5.6 Sol", "reasoning": true, "input": ["text", "image"], "cost": {"input": 5, "output": 30, "cacheRead": 0.5, "cacheWrite": 6.25, "tiers": [{"inputTokensAbove": 272000, "input": 10, "output": 45, "cacheRead": 1, "cacheWrite": 12.5}]}, "contextWindow": 272000, "maxTokens": 128000, "thinkingLevelMap": {"xhigh": "xhigh", "max": "max", "minimal": "low"}, "compat": {"supportsOpenAIGrammarTools": true, "supportsAdditionalTools": true, "supportsToolSearch": true}},
      {"id": "gpt-5.6-terra", "name": "GPT-5.6 Terra", "reasoning": true, "input": ["text", "image"], "cost": {"input": 2, "output": 12, "cacheRead": 0.2, "cacheWrite": 2.5, "tiers": [{"inputTokensAbove": 272000, "input": 4, "output": 18, "cacheRead": 0.4, "cacheWrite": 5}]}, "contextWindow": 272000, "maxTokens": 128000, "thinkingLevelMap": {"xhigh": "xhigh", "max": "max", "minimal": "low"}, "compat": {"supportsOpenAIGrammarTools": true, "supportsAdditionalTools": true, "supportsToolSearch": true}},
      {"id": "gpt-6-astra", "name": "GPT-6 Astra (Pooled)", "reasoning": true, "input": ["text", "image"], "cost": {"input": 10, "output": 50, "cacheRead": 1, "cacheWrite": 12.5, "tiers": [{"inputTokensAbove": 272000, "input": 20, "output": 75, "cacheRead": 2, "cacheWrite": 25}]}, "contextWindow": 272000, "maxTokens": 128000, "thinkingLevelMap": {"off": null, "minimal": "low", "low": "low", "medium": "medium", "high": "high", "xhigh": "xhigh", "max": "max"}, "compat": {"supportsOpenAIGrammarTools": true, "supportsAdditionalTools": true, "supportsToolSearch": true}},
      {"id": "gpt-6-sol", "name": "GPT-6 Sol (Pooled)", "reasoning": true, "input": ["text", "image"], "cost": {"input": 2, "output": 10, "cacheRead": 0.2, "cacheWrite": 2.5, "tiers": [{"inputTokensAbove": 272000, "input": 4, "output": 15, "cacheRead": 0.4, "cacheWrite": 5}]}, "contextWindow": 272000, "maxTokens": 128000, "thinkingLevelMap": {"off": "none", "minimal": "low", "low": "low", "medium": "medium", "high": "high", "xhigh": "xhigh", "max": "max"}, "compat": {"supportsOpenAIGrammarTools": true, "supportsAdditionalTools": true, "supportsToolSearch": true, "supportsMidConvoSystemMessages": true}},
      {"id": "gpt-6.1-sol", "name": "GPT-6.1 Sol (Pooled)", "reasoning": true, "input": ["text", "image"], "cost": {"input": 2, "output": 10, "cacheRead": 0.1, "cacheWrite": 2.5, "tiers": [{"inputTokensAbove": 272000, "input": 4, "output": 15, "cacheRead": 0.2, "cacheWrite": 5}]}, "contextWindow": 272000, "maxTokens": 128000, "thinkingLevelMap": {"off": null, "minimal": "low", "low": "low", "medium": "medium", "high": "high", "xhigh": "xhigh", "max": "max"}, "compat": {"supportsOpenAIGrammarTools": true, "supportsAdditionalTools": true, "supportsToolSearch": true, "supportsMidConvoSystemMessages": true}},
    ],
  });
}
