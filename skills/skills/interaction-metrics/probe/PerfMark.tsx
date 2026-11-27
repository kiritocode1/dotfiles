import { useLayoutEffect, type ReactNode } from "react";

import { perfMark } from "./interaction-probe";

/**
 * Marks the content a case waits for. Put it where the screen's real content mounts, not its
 * skeleton: `<PerfMark id="screen:orders">{rows}</PerfMark>`. It renders nothing of its own.
 */
export function PerfMark({ id, children }: { readonly id: string; readonly children?: ReactNode }) {
  usePerfMark(id);
  return children;
}

/** The hook form, for a component that already owns the content: `usePerfMark("screen:orders")`. */
export function usePerfMark(id: string, ready = true) {
  useLayoutEffect(() => {
    if (ready) perfMark(id);
  }, [id, ready]);
}
