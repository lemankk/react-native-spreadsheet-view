import { View } from "react-native";
import { styles } from "./styles";
import { SpreadsheetRowProps } from "./types";
import { memo } from "react";

export const  SpreadsheetRow = memo(({
  children,
  style,
  ...rest
}: SpreadsheetRowProps) => {
  return (
    <View style={[styles.row, style]} {...rest}>
      {children}
    </View>
  );
})
SpreadsheetRow.displayName = 'SpreadsheetRow';

