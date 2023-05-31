import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({

    rootView: {
      flex: 1,
      position: "relative",
      zIndex: 0,
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "#ccc",
    },
    listHeader: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: "#efefef",
    },
    topCorner: { height: "100%" },
    columnHeader: { height: "100%" },
  
    h100: { width: 1, height: "100%" },
    w100: { height: 1, width: "100%" },
  
    listBody: {
      flex: 1,
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  
    rowHeader: { height: "100%", backgroundColor: "#efefef" },
    rowBody: { height: "100%" },
  
    separator: { backgroundColor: "#000" },
   
    cell: { borderColor: "#ccc", borderWidth: 1, borderStyle: "solid" },
  
    overlay: { position: "absolute", zIndex: 1, width: "100%", height: "100%" },
  });
  