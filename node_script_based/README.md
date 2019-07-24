# Node Based Version
## Description

This version of the script generates a license file using a node command, so it's independend of webpack.

## Usage
### Script

```shell
node index.js 
```

Parameters:
```shell
-n <path_to_node_modules_and_package.json>
-o <path_to_output_folder>
-f <custom_filename>
-p <proxy_string>
```

### Component

In the react component, just change the ```require()``` line at the top to correct path.
