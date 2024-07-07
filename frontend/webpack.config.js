// node.js file

const HtmlWebpackPlugin = require("html-webpack-plugin");
//not import: it's node
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// ...

module.exports = {
  mode: "development",
  entry: "./src/index.js", //1파일시작위치-입력
  output: {
    //2출력
    path: path.resolve(__dirname, "dist"), //__dirname: 현재위치
    filename: "bundle.js",
  },
  devServer: {
    compress: false,
    port: 5050,
  },
  module: {
    //3트랜스파일러
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    //4마지막 처리 과정용 프로그램
    new HtmlWebpackPlugin({
      title: "none",
      template: "./index.html",
    }),
  ],
};
