import { faker } from "@faker-js/faker";
import FlagIcons from "@svgr-iconkit/flag-icons/native";
import { format } from "date-fns";
import {
  Button,
  Checkbox,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
  View,
  Avatar,
} from "native-base";
import React, { PropsWithChildren, useMemo, useRef, useState } from "react";

import {
  SpreadsheetViewRef,
  DataGrid,
  IDataGridColumn,
  SpreadsheetRowProps,
} from "react-native-spreadsheet-view";

type DataRowType = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  city_name: string;
  country_code: string;
  birthdate: Date;
  registeredAt: Date;
};

const fields: IDataGridColumn<DataRowType>[] = [
  {
    key: "id",
    label: "#",
    width: 40,
    renderCell: ({ indexPath }) => {
      return <Text>{indexPath.row}</Text>;
    },
  },
  {
    key: "name",
    label: "Name",
    width: 160,
    renderCell: ({ item: row }) => {
      return <HStack alignItems="center" space="2"><Avatar source={{ uri: row.avatar }}></Avatar><Text>{row.name}</Text></HStack>
    },
  },
  { key: "email", label: "Email", width: 200 },
  {
    key: "city_name",
    label: "City Name",
    width: 200,
    renderCell: ({ item: row }) => {
      return (
        <Flex w="100%" flexDirection="row" justifyContent="space-between">
          <Text>
            {row.city_name}
            {` `}
          </Text>

          <FlagIcons name={row.country_code.toLowerCase() as any} size={24} />
        </Flex>
      );
    },
  },
  {
    key: "birthdate",
    label: "Birth Date",
    renderCell: ({ item: row }) => {
      return <Text w="100%">{format(row.birthdate, "yyyy-MM-dd")}</Text>;
    },
  },
];

export function createRandomUser() {
  return {
    id: 0,
    name: faker.person.firstName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    city_name: faker.location.city(),
    country_code: faker.location.countryCode(),
    birthdate: faker.date.birthdate(),
    registeredAt: faker.date.past(),
  };
}

export const USERS: DataRowType[] = faker.helpers
  .multiple(createRandomUser, {
    count: 200,
  })
  .map((r, index) => ({ ...r, id: index + 1 }));

export default function ExampleView() {
  const listRef = useRef<SpreadsheetViewRef>(null);
  const listBRef = useRef<SpreadsheetViewRef>(null);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const isSelectedAll = selectedRows.length >= USERS.length;

  const listBFields = [
    {
      key: "selected",
      label: "#",
      width: 40,
      renderHeader: ({ indexPath }) => {
        return (
          <Flex>
            <Checkbox
              aria-label="Select All"
              value={"yes"}
              isChecked={isSelectedAll}
              onChange={(val) => {
                setSelectedRows(isSelectedAll ? [] : USERS.map((r) => r.id));
                listBRef.current?.renderAllItems();
              }}
            />
          </Flex>
        );
      },
      renderCell: ({ indexPath, item }) => {
        const isSelected = isSelectedAll || selectedRows.includes(item.id);
        // console.log("DataGridCell Row %s Col %s isSelected=%o id=%s", indexPath.row, indexPath.column, isSelected, item.id)
        return (
          <Flex>
            <Checkbox
              aria-label={`Select ID #${item.id}`}
              value={"yes"}
              isChecked={isSelected}
              onChange={(val) => {
                if (isSelected) {
                  setSelectedRows((rows) =>
                    rows.filter((id) => id !== item.id)
                  );
                } else {
                  setSelectedRows((rows) =>
                    !rows.includes(item.id) ? [...rows, item.id] : rows
                  );
                }
                listBRef.current?.renderItemsAtRows([0, indexPath.row]);
              }}
            />
          </Flex>
        );
      },
    },
    ...fields,
  ];

  const rowRenderer = ({
    row,
    children,
    ...rest
  }: PropsWithChildren<SpreadsheetRowProps>) => {
    if (row === 0 || !USERS[row - 1]) {
      return (
        <View bgColor="gray.400" {...rest}>
          {children}
        </View>
      );
    }
    const dataRow = USERS[row - 1];
    const isSelected = selectedRows.includes(dataRow.id);
    // console.log("Rendering Row %s, isSelected=%o", row, isSelected, dataRow.id)

    return (
      <View
        {...rest}
        backgroundColor={
          isSelected ? "blue.200" : row % 2 === 0 ? "#efefef" : "#fff"
        }
      >
        {children}
      </View>
    );
  };

  const totalRows = 1 + USERS.length;
  return (
    <VStack space={2} m="2" flex={1}>
      <VStack h="100%">
        <HStack space={2} p="2">
          <Button onPress={() => listBRef.current?.scrollToRow(0, true)}>
            Top
          </Button>
          <Button
            onPress={() => listBRef.current?.scrollToRow(totalRows, true)}
          >
            Bottom
          </Button>
          <Button
            onPress={() => {
              const row = (totalRows * Math.random()) << 0;
              listBRef.current?.scrollToRow(row, true);
            }}
          >
            Random
          </Button>
        </HStack>
        <DataGrid
          ref={listBRef}
          sizeForRow={80}
          data={USERS}
          columns={listBFields}
          RowComponent={rowRenderer}
          style={{
            backgroundColor: "#ccc",
            borderWidth: 1,
            borderColor: "#666",
          }}
          cellSpace={1}
          preloadForRow={2}
          preloadForColumn={4}
          frozenColumns={2}
          cellStyle={{
            display: "flex",
            flexDirection: "row",
            borderWidth: 0,
            alignItems: "center",
            padding: 4,
            backgroundColor: "transparent",
          }}
          separatorStyle={{ backgroundColor: "#ccc" }}
        />
      </VStack>
    </VStack>
  );
}
