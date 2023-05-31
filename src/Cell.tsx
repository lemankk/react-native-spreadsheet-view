import { View } from "react-native";
import { SpreadsheetCellProps } from "./types";
import { styles } from "./styles";

export function SpreadsheetCell({
  children,
  style,
  ...rest
}: SpreadsheetCellProps) {
  return (
    <View style={[styles.cell, style]} {...rest}>
      {children}
    </View>
  );
}
