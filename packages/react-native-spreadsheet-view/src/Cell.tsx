import { View } from "react-native";
import { styles } from "./styles";
import { SpreadsheetCellProps } from "./types";
import { memo } from "react";

export const SpreadsheetCell = memo(
  ({ children, style, ...rest }: SpreadsheetCellProps) => {
    return (
      <View style={[styles.cell, style]} {...rest}>
        {children}
      </View>
    );
  }
);

SpreadsheetCell.displayName = "SpreadsheetCell";
