# Webpack Plugin Version

## Usage
### Script
Add as plugin for webpack. 

i.e.
```js
module.exports = merge(common, {
  mode: 'development',
  devtool: "source-map",
  devServer: {
    https: false,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    new HtmlWebPackPlugin({
      title: "EDEKA AzubiGuide",
      template: "./src/index.html",
      filename: "./index.html",
      faviconPath: "/src/assets/images/"
    }),
    new webpack.DefinePlugin({
      APPLICATIONINSIGHTS_INSTRUMENTATIONKEY: null,
      DEBUG: true
    }),
    new LicenseExtractorPlugin() // here or new LicenseExtractorPlugin('my-licenses.json', '123.456.222.111:4289')
  ]
});
```

Pugin has two params: ```outputFilename``` and ```proxyString```

It exports the json file into the Webpack output dir. 

### Component

Just include it in your Page. It fetch the file from the server and include it.