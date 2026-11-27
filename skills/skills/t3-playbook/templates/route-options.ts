// Route presets, adapted from T3 Code's apps/mobile/src/features/layout/route-options.ts.
// A route says what it is (a page, a sheet, a modal, immersive media); the preset owns how each
// platform presents it, so screens never set presentation or header options themselves.
//
// Use where the stack is declared:
//   <Stack.Screen name="thread/[id]" options={pageRoute()} />
//   <Stack.Screen name="filters" options={sheetRoute({ detent: 0.5, title: "Filters" })} />
//
// Android draws no native header here: each screen renders its own bar in-tree, which keeps one
// bar contract across platforms. Drop that line if the app uses native Android headers.
//
// Needs: @react-navigation/native-stack (or expo-router's Stack), react-native-screens 4+,
// and expo-glass-effect for the iOS 26 glass check.

import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import { Platform } from "react-native";

type HeaderStyle = "glass" | "solid" | "none";

const GLASS = Platform.OS === "ios" && isGlassEffectAPIAvailable();

const BASE_HEADER = {
  headerBackButtonDisplayMode: "minimal",
  headerBackTitle: "",
  headerLargeTitle: false,
  headerShadowVisible: false,
  headerShown: Platform.OS === "ios",
} satisfies NativeStackNavigationOptions;

function headerOptions(header: HeaderStyle): NativeStackNavigationOptions {
  if (header === "none") return { headerShown: false };
  // Glass bars let content scroll under them. Before iOS 26 the same route gets a solid bar.
  if (header === "glass" && GLASS) {
    return { ...BASE_HEADER, headerTransparent: true, headerStyle: { backgroundColor: "transparent" } };
  }
  return { ...BASE_HEADER, headerTransparent: false };
}

const withTitle = (title: string | undefined) => (title === undefined ? {} : { title });

/** A page: pushed on a phone, a column page on a wide window. */
export function pageRoute(options: { title?: string; header?: HeaderStyle; root?: boolean } = {}): NativeStackNavigationOptions {
  return {
    ...headerOptions(options.header ?? "glass"),
    ...withTitle(options.title),
    ...(options.root ? { headerBackVisible: false } : {}),
  };
}

export interface SheetRouteOptions {
  readonly title?: string;
  readonly header?: HeaderStyle;
  /** The initial detent as a fraction of the window, or "full". */
  readonly detent: number | "full";
  /** The largest detent. Defaults to the full window on iOS and 0.92 on Android. */
  readonly maxDetent?: number;
  /** Android sizes the sheet to its content instead of using detents. */
  readonly androidFit?: boolean;
  /** Where an Android form sheet cannot host the screen (a keyboard-driven composer): push it, or present full screen. */
  readonly android?: "sheet" | "card" | "fullScreen";
}

/** A sheet over the current screen: a form sheet with a grabber. It closes; it never goes back. */
export function sheetRoute(options: SheetRouteOptions): NativeStackNavigationOptions {
  const shared = {
    ...headerOptions(options.header ?? "glass"),
    ...withTitle(options.title),
    headerBackVisible: false,
    gestureEnabled: true,
  } satisfies NativeStackNavigationOptions;
  if (Platform.OS === "android" && options.android === "card") return { ...shared, presentation: "card" };
  if (Platform.OS === "android" && options.android === "fullScreen") return { ...shared, presentation: "fullScreenModal" };

  const max = options.maxDetent ?? (Platform.OS === "ios" ? 1 : 0.92);
  const detents = options.detent === "full" ? [1] : [options.detent, max];
  return {
    ...shared,
    presentation: "formSheet",
    sheetGrabberVisible: true,
    sheetAllowedDetents: Platform.OS === "android" && options.androidFit ? "fitToContents" : detents,
    ...(Platform.OS === "android" ? { sheetCornerRadius: 28 } : {}),
  };
}

/** A full-screen modal with a close button, not a back button. The screen draws its own bar by default. */
export function modalRoute(options: { title?: string; header?: HeaderStyle } = {}): NativeStackNavigationOptions {
  return {
    ...headerOptions(options.header ?? "none"),
    ...withTitle(options.title),
    headerBackVisible: false,
    presentation: "fullScreenModal",
  };
}

/** Full-screen media (a camera, a video, a map) with no bar and no dismiss gesture. */
export function immersiveRoute(options: { hideSystemBars?: boolean } = {}): NativeStackNavigationOptions {
  return {
    presentation: "fullScreenModal",
    headerShown: false,
    gestureEnabled: false,
    ...(options.hideSystemBars ? { autoHideHomeIndicator: true, navigationBarHidden: true, statusBarHidden: true } : {}),
  };
}
