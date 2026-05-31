import { env } from "@/env";
import type { AiProvider } from "./types";

/**
 * MyArchitectAI provider. Endpoints/auth are wired in Phase 2 — see the
 * developer docs at https://portal.myarchitectai.com/docs. The interface and
 * env (`MYARCHITECTAI_API_KEY`) are in place so the render engine can drop in.
 */
export function createMyArchitectAiProvider(): AiProvider {
  return {
    name: "myarchitectai",
    async createRender() {
      if (!env.MYARCHITECTAI_API_KEY) {
        throw new Error("MYARCHITECTAI_API_KEY belum dikonfigurasi");
      }
      throw new Error(
        "MyArchitectAI render belum diimplementasi (Phase 2 — render engine).",
      );
    },
  };
}
