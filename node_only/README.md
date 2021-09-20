# Node Based Version

## Description

This version of the script generates a license file using a node command, so it's independend of webpack.

## Usage

### Prerequisite

Install deps using yarn.

```shell
yarn
```

### Script

```shell
yarn extract
```

Parameters:

```shell
-n <path_to_node_modules_and_package.json>
-o <path_to_output_folder>, default is this dir
-f <custom_filename>, default is licenses.json
-p <proxy_string>
```

The resulting File should be formatted, if it is used for human consumption.

### Example

```shell
yarn extract -n "C:\sources\HiDriveWindowsClient\HiDriveClient\hidrive.ui" -o "C://" -f "modules.json"
```

## Shape of json

```js
arrayOf(shape({
    name: string,
    version: string,
    author: string,
    license: string,
    licenseText: string,
}))
```
