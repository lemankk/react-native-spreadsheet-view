import React from "react";
import { Flex, NativeBaseProvider } from "native-base";
import ExampleView from "./DataGridExample";

export default function App() {
  return (
    <NativeBaseProvider config={{strictMode: "off"}}>
      <Flex h="100%" safeArea>
        <ExampleView />
      </Flex>
    </NativeBaseProvider>
  );
}
