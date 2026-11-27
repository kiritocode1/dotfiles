import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { perfInput } from "./interaction-probe";

/**
 * React Native only: records touches for the probe. Wrap the app's root once. Raw touch events
 * bubble to it without it ever taking the responder; the end, which latency counts from, uses the
 * capture phase so a child cannot hide it.
 */
export function PerfRoot({ children }: { readonly children: ReactNode }) {
  return (
    <View
      style={styles.root}
      onTouchStart={() => perfInput("press-start")}
      onTouchEndCapture={() => perfInput("press-end")}
      onTouchCancel={() => perfInput("press-cancel")}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
