// node.js file

const HtmlWebpackPlugin = require("html-webpack-plugin");
//not import: it's node
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
// ...

module.exports = {
  mode: "development",
  entry: "./src/_app.js", //1파일시작위치-입력
  output: {
    //2출력
    path: path.resolve(__dirname, "dist"), //__dirname: 현재위치
    filename: "bundle.js",
    publicPath: "/",
  },
  devServer: {
    compress: false,
    // port: 5050,
    // contentBase: path.join(__dirname, "dist"),
    hot: true,
    port: 8080,
    watchFiles: "./src",
    // publicPath: "/", //option err
    historyApiFallback: true,
    //valid  object { allowedHosts?, bonjour?, client?, compress?, devMiddleware?, headers?,
    // historyApiFallback?, host?, hot?, ipc?, liveReload?, onListening?, open?, port?, proxy?,
    // server?, setupExitSignals?, setupMiddlewares?, static?, watchFiles?, webSocketServer? }
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
    new webpack.HotModuleReplacementPlugin(),
  ],
};
