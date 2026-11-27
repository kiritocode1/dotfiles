// React Native: UI-thread frame times from a worklet loop. Metro picks this file over
// ui-frames.ts; web bundlers never see it, so its optional require cannot break their scan.

interface Worklets {
  scheduleOnUI: (fn: () => void) => void;
  runOnUISync: <T>(fn: () => T) => T;
}
interface UiRuntime {
  __perfUiFrames?: number[];
  __perfUiFramesOn?: boolean;
}

let worklets: Worklets | null = null;
// Metro treats a require inside try as optional: apps without react-native-worklets still build.
try {
  worklets = require("react-native-worklets") as Worklets;
} catch {
  worklets = null;
}

function begin() {
  "worklet";
  const ui = globalThis as UiRuntime;
  ui.__perfUiFrames = [];
  ui.__perfUiFramesOn = true;
  const tick = (time: number) => {
    if (!ui.__perfUiFramesOn) return;
    ui.__perfUiFrames!.push(time);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function end() {
  "worklet";
  const ui = globalThis as UiRuntime;
  ui.__perfUiFramesOn = false;
  return ui.__perfUiFrames ?? [];
}

export const hasUiFrames = () => worklets !== null;
export const startUiFrames = () => worklets?.scheduleOnUI(begin);
export const stopUiFrames = (): number[] => (worklets ? worklets.runOnUISync(end) : []);
