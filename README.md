# LicenseExtractorPlugin
A Plugin to Extract Licenses

## What?

It generates a JSON file containing all the licenses and from all node modulkes in the ```node_modules``` folder recursively. The lisencec get saved once, it they repeat.

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