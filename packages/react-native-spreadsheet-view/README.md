# react-native-spreadsheet-view

A component for supporting spreadsheet liked grid in React Native.

Features to be supported:

- [x] Frozen header row, left columns
- [x] Bi-directional scroll
- [x] Re-renderable by each cell
- [ ] Merge allowed cells
- [ ] Row selection

## How-to use

```tsx
import { SpreadsheetView } from "react-native-spreadsheet-view";
import { View, Text } from "react-native";


export default function Example () {
    return <View style={{paddingTop:100, paddingBottom:50}}>
        <SpreadsheetView
            numRows={300}
            numColumns={200}
            sizeForRow={40}
            sizeForColumn={120}
            renderItem={({indexPath}) => {
                return <Text>{`${indexPath.row},${indexPath.column}`}}</Text>
            }}
        />
    </View>
}

```


## Example - frozen table

```typescript
import { SpreadsheetView } from "react-native-spreadsheet-view";

const fields = [{key: 'id', label: '#'}, {key: 'name', label: 'Name'}, {key: 'city_name', label: 'City Name'}]
const data = [{id: 1, name: 'Paul', city_name: 'Tokyo'}]

export default function Example () {
    return <SpreadsheetView
        frozenRows={1}
        frozenColumns={1}
        sizeForRow={40}
        sizeForColumn={120}
        numRows={data.length + 1}
        numColumns={fields.length + 1}
        renderItem={({indexPath}) => {
            const field = fields[indexPath.column]
            if (indexPath.row === 0 ) {
                return <Text>{field.label}</Text>
            }
            return  <Text>{data[field.key]}</Text>
        }}
    />
}

```



## Example - data grid

```typescript
import { DataGrid } from "react-native-spreadsheet-view";

const fields = [{key: 'id', label: '#'}, {key: 'name', label: 'Name'}, {key: 'city_name', label: 'City Name'}]
const data = [{id: 1, name: 'Paul', city_name: 'Tokyo'}]

export default function Example () {
    return <DataGrid
        columns={fields}
        data={data}
    />
}

```
