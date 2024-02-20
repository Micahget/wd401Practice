const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    },
    module: { // before we write this code, I have to install css-loader, style-loader and file-loader modules. Because, we can't load this files directly without loader since webpacks default is js code.
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader'],
            }
      ]
    },
    optimization: { // this part is for lazy loading. It is for the code splitting. It is for the performance of the application. It is for the optimization of the application.
        splitChunks: {
            chunks: 'all'
        },
    }
};
