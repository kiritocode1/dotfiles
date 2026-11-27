// Dev-only probe read by the interaction-metrics runner through CDP (Hermes or Chromium).
// Every timestamp is the app's own performance.now(), so runner latency never reaches a metric.
// Copy into the app unchanged; see the skill's references/integration.md for where to import it.
import { hasUiFrames, startUiFrames, stopUiFrames } from "./ui-frames";

interface Fiber {
  readonly tag: number;
  readonly type: unknown;
  readonly elementType: unknown;
  readonly flags: number;
  readonly child: Fiber | null;
  readonly sibling: Fiber | null;
  readonly alternate: Fiber | null;
}
interface FiberRoot {
  readonly current: Fiber & { readonly actualDuration?: number };
}
interface DevToolsHook {
  onCommitFiberRoot?: (id: unknown, root: FiberRoot, ...rest: unknown[]) => unknown;
  __interactionProbe?: true;
  [key: string]: unknown;
}
interface Mark {
  readonly id: string;
  readonly at: number;
  frameAt: number | null;
  /** Whether this is the mark's first mount since the JS runtime started. */
  readonly first: boolean;
}
interface ProbeWindow {
  readonly startedAt: number;
  readonly inputs: Array<{ readonly kind: string; readonly at: number }>;
  readonly commits: Array<{ readonly at: number; readonly ms: number }>;
  readonly marks: Mark[];
  readonly keys: number[];
  readonly js: number[];
  readonly renders: Map<string, number> | null;
}
interface Runtime {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: DevToolsHook;
  HermesInternal?: { getInstrumentedStats?: () => Record<string, number> };
  gc?: () => void;
  __perfProbe?: unknown;
  document?: { addEventListener: (type: string, listener: () => void, capture: boolean) => void };
}

const runtime = globalThis as Runtime;
const PROBE_VERSION = 1;
// Function, ForwardRef, Memo, SimpleMemo and Class components: the fibers that "render".
const COMPONENT_TAGS = new Set([0, 1, 11, 14, 15]);
const PERFORMED_WORK = 1;

let open: ProbeWindow | null = null;
const everSeen = new Set<string>();
const round1 = (value: number) => Math.round(value * 10) / 10;

function nameOf(fiber: Fiber) {
  const type = (fiber.elementType ?? fiber.type) as
    | { displayName?: string; name?: string; type?: { name?: string }; render?: { name?: string } }
    | string
    | null;
  if (!type || typeof type === "string") return "Anonymous";
  return type.displayName ?? type.name ?? type.type?.name ?? type.render?.name ?? "Anonymous";
}

// Same rule React DevTools uses: an unchanged child pointer means the subtree did not render,
// and a reused fiber keeps stale flags, so it must not be visited.
function countRenders(first: Fiber | null, into: Map<string, number>) {
  for (let fiber = first; fiber; fiber = fiber.sibling) {
    const previous = fiber.alternate;
    if (
      COMPONENT_TAGS.has(fiber.tag) &&
      (previous === null || (fiber.flags & PERFORMED_WORK) === PERFORMED_WORK)
    ) {
      const name = nameOf(fiber);
      into.set(name, (into.get(name) ?? 0) + 1);
    }
    if (fiber.child && (previous === null || fiber.child !== previous.child))
      countRenders(fiber.child, into);
  }
}

function onCommit(root: FiberRoot) {
  const window = open;
  if (!window) return;
  window.commits.push({ at: round1(performance.now()), ms: round1(root.current.actualDuration ?? 0) });
  if (window.renders) countRenders(root.current.child, window.renders);
}

// React reads the hook once when its renderer loads. React Native dev builds always have one;
// a web page without the DevTools extension gets this minimal stand-in, which is why the probe
// must be imported before react-dom on the web.
function installCommitHook() {
  let hook = runtime.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    let nextId = 0;
    hook = {
      supportsFiber: true,
      isDisabled: false,
      renderers: new Map(),
      inject: () => ++nextId,
      checkDCE: () => {},
      onCommitFiberUnmount: () => {},
      onPostCommitFiberRoot: () => {},
      onCommitFiberRoot: () => {},
    };
    runtime.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
  }
  if (hook.__interactionProbe) return;
  hook.__interactionProbe = true;
  const original = hook.onCommitFiberRoot?.bind(hook);
  hook.onCommitFiberRoot = (id, root, ...rest) => {
    onCommit(root);
    return original?.(id, root, ...rest);
  };
}

/** Records an input. React Native apps call this from `<PerfRoot>`; web pages get it from listeners. */
export function perfInput(kind: string) {
  open?.inputs.push({ kind, at: round1(performance.now()) });
}

/** Records a keystroke and its delay to the next frame. */
export function perfKey() {
  const window = open;
  if (!window) return;
  const at = performance.now();
  window.inputs.push({ kind: "key", at: round1(at) });
  requestAnimationFrame(() => window.keys.push(round1(performance.now() - at)));
}

/** Marks content as shown; `<PerfMark>` calls this from a layout effect. */
export function perfMark(id: string) {
  const first = !everSeen.has(id);
  everSeen.add(id);
  const window = open;
  if (!window) return;
  const mark: Mark = { id, at: round1(performance.now()), frameAt: null, first };
  window.marks.push(mark);
  requestAnimationFrame(() => {
    mark.frameAt = round1(performance.now());
  });
}

function jsFrame(time: number) {
  const window = open;
  if (!window) return;
  window.js.push(round1(time));
  requestAnimationFrame(jsFrame);
}

function heapMB() {
  const hermes = runtime.HermesInternal?.getInstrumentedStats?.().js_heapSize;
  if (typeof hermes === "number") return round1(hermes / 1_048_576);
  const chromium = (performance as { memory?: { usedJSHeapSize: number } }).memory;
  return chromium ? round1(chromium.usedJSHeapSize / 1_048_576) : null;
}

function installWebInputs() {
  const document = runtime.document;
  if (!document) return;
  document.addEventListener("pointerdown", () => perfInput("press-start"), true);
  document.addEventListener("pointerup", () => perfInput("press-end"), true);
  document.addEventListener("pointercancel", () => perfInput("press-cancel"), true);
  document.addEventListener("wheel", () => perfInput("wheel"), true);
  document.addEventListener("keydown", () => perfKey(), true);
}

const api = {
  version: PROBE_VERSION,
  /** Opens a measurement window. `renders` counts component renders per commit (slower). */
  start(options?: { renders?: boolean }) {
    open = {
      startedAt: round1(performance.now()),
      inputs: [],
      commits: [],
      marks: [],
      keys: [],
      js: [],
      renders: options?.renders ? new Map() : null,
    };
    requestAnimationFrame(jsFrame);
    startUiFrames();
    return true;
  },
  /** Cheap progress of the open window, so the runner can wait for quiet without stopping it. */
  peek() {
    const window = open;
    const last = Math.max(
      window?.inputs.at(-1)?.at ?? 0,
      window?.commits.at(-1)?.at ?? 0,
      ...(window?.marks ?? []).map((mark) => mark.frameAt ?? mark.at),
    );
    return JSON.stringify({
      open: window !== null,
      now: round1(performance.now()),
      last,
      inputs: window?.inputs.length ?? 0,
      marks: (window?.marks ?? []).flatMap((mark) => (mark.frameAt === null ? [] : [mark.id])),
    });
  },
  /** Closes the window and returns everything it recorded. */
  stop() {
    const window = open;
    open = null;
    if (!window) return JSON.stringify(null);
    const uiFrames = stopUiFrames().map(round1);
    return JSON.stringify({
      startedAt: window.startedAt,
      inputs: window.inputs,
      commits: window.commits,
      marks: window.marks,
      keys: window.keys,
      js: window.js,
      ui: uiFrames,
      renders: window.renders
        ? [...window.renders].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
        : null,
      heapMB: heapMB(),
    });
  },
  /** Heap after a full collection when the runtime exposes `gc`. */
  heap() {
    runtime.gc?.();
    return JSON.stringify({ heapMB: heapMB(), collected: typeof runtime.gc === "function" });
  },
  info() {
    return JSON.stringify({
      version: PROBE_VERSION,
      engine: runtime.HermesInternal ? "hermes" : "chromium",
      uiFrames: hasUiFrames(),
      marksSeen: [...everSeen],
    });
  },
  mark: perfMark,
  input: perfInput,
  key: perfKey,
};

let installed = false;
/** Installs `globalThis.__perfProbe`. Call once, as early as possible, in development builds only. */
export function installInteractionProbe() {
  if (installed) return;
  installed = true;
  installCommitHook();
  installWebInputs();
  runtime.__perfProbe = api;
}
