import { View } from "react-native";
import { SpreadsheetRowProps } from "./types";
import { styles } from "./styles";

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
