# LicenseExtractorPlugin
A Plugin to Extract Licenses

## What?

It generates a JSON file containing all the licenses and from all node modules in the ```node_modules``` folder recursively. The lisencec get saved once, it they repeat.

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

## Versions

There are two versions:
1. A webpack based version: A plugin for webpack, to include in the build. (The include and forget version)
2. A node based version: A Node.js script to manually run (if you need the flexibility)

## Report
There is also a report tool, to generate a .csv containing all licenses and their classification depending on german rule.