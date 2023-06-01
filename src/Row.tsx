import { View } from "react-native";
import { styles } from "./styles";
import { SpreadsheetRowProps } from "./types";

export function SpreadsheetRow({
  children,
  style,
  ...rest
}: SpreadsheetRowProps) {
  return (
    <View style={[styles.cell, style]} {...rest}>
      {children}
    </View>
  );
}
