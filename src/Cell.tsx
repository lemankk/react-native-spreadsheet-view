import { View } from "react-native";
import { styles } from "./styles";
import { SpreadsheetCellProps } from "./types";

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
