import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  rootView: {
    flex: 1,
    position: "relative",
    zIndex: 0,
    // borderWidth: 1,
    // borderStyle: "solid",
    // borderColor: "#ccc",
  },

  h100: { width: 1, height: "100%" },
  w100: { height: 1, width: "100%" },

  topView: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    // backgroundColor: "#efefef",
  },
  topCorner: { flexGrow: 0, height: "100%", maxWidth: "100%" },
  columnHeader: { flex: 1, height: "100%", maxWidth: "100%" },

  bodyView: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bodyLeft: {
    flexGrow: 0,
    height: "100%",
    // backgroundColor: "#efefef"
  },

  bodyGrid: { flex: 1, height: "100%" },

  separator: { backgroundColor: "#000" },


  row: {
    
  },
  cell: {
    overflow: "hidden"
    // borderColor: "#ccc", borderWidth: 1, borderStyle: "solid"
  },

  overlay: { position: "absolute", zIndex: 1, width: "100%", height: "100%" },
});
