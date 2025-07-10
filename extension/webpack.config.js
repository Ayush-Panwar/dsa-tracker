import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '../.env' });

// Define API URL based on environment or fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    content: './content/content.ts',
    background: './background/background.ts',
    'popup/popup': './popup/popup.ts',
    'fetch-interceptor': './content/fetch-interceptor.ts',
    'popup/error-patterns': './popup/error-patterns.js',
    'pageFetchInterceptor': './content/pageFetchInterceptor.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup/popup.html', to: 'popup/popup.html' },
        { from: 'popup/popup.css', to: 'popup/popup.css' },
        { from: 'popup/error-patterns.html', to: 'popup/error-patterns.html' }
      ],
    }),
    new webpack.DefinePlugin({
      'process.env.API_BASE_URL': JSON.stringify(API_BASE_URL)
    }),
  ],
}; 