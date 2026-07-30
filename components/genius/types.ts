import type { GeniusBlock } from "@/types/genius";

export type ExtractedGeniusBlock<T extends GeniusBlock["type"]> = Extract<GeniusBlock, { type: T }>;
