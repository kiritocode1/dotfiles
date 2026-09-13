import { Type, StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { checkCpaImageHealth, createCpaImage } from "./cpa-image.ts";

/** Add proxy image generation without changing Pi's chat provider or saved authentication. */
export default function registerCpaImageExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "cpa_image",
    label: "GPT Image 2.5",
    description: "Generate or edit one image with GPT Image 2.5 through the existing local CPA account pool. Supply local image paths for editing. Saves a new PNG and returns its preview. Never overwrites files. Requires CPA_KEY, consumes image quota, and does not access OAuth files. Requests time out after 180 seconds without automatic retries.",
    promptSnippet: "Generate or edit images with GPT Image 2.5 through the existing account pool",
    promptGuidelines: [
      "Use cpa_image for GPT Image 2.5 generation or editing through CPA. Pass existing image paths in images when editing and choose a new output path.",
      "If cpa_image reports an authentication error, stop and report it. Do not log out, replace credentials, or manually refresh tokens.",
    ],
    parameters: Type.Object({
      prompt: Type.String({ minLength: 1, maxLength: 32000, description: "Image description or edit instructions" }),
      images: Type.Optional(Type.Array(Type.String(), { maxItems: 4, description: "Local PNG/JPEG/WebP paths for editing; omit for generation" })),
      output: Type.Optional(Type.String({ description: "New PNG path relative to the project, defaults to generated-images/<uuid>.png" })),
      quality: Type.Optional(StringEnum(["auto", "low", "medium", "high"] as const)),
      size: Type.Optional(StringEnum(["auto", "1024x1024", "1536x1024", "1024x1536"] as const)),
    }),
    async execute(_id, params, signal, onUpdate, ctx) {
      onUpdate?.({ content: [{ type: "text", text: "Requesting GPT Image 2.5 through CPA..." }], details: {} });
      const result = await createCpaImage({ ...params, cwd: ctx.cwd, signal });
      return {
        content: [
          { type: "text", text: `Saved ${result.path} (${result.width} x ${result.height}, ${result.bytes} bytes)` },
          { type: "image", mimeType: "image/png", data: result.base64 },
        ],
        details: { path: result.path, model: result.model, width: result.width, height: result.height },
      };
    },
  });

  pi.registerCommand("cpa-image-status", {
    description: "Check GPT Image 2.5 availability without generating an image",
    async handler(_args, ctx) {
      try {
        const result = await checkCpaImageHealth();
        pi.sendMessage({ customType: "cpa-image-status", content: JSON.stringify(result), display: true });
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : "CPA image health check failed.", "error");
      }
    },
  });
}
