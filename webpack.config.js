/*
 *  Copyright 2016 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactTwistPlugin = require('@twist/react-webpack-plugin');
const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');

const config = new ReactTwistPlugin();

if (process.env.NODE_ENV === 'test') {
    config.addBabelPlugin('istanbul');
}

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    context: __dirname,
    entry: './example/Main.jsx',
    devServer: {
        contentBase: path.join(__dirname, 'build'),
        compress: true,
        port: 9000
    },
    resolve: {
        extensions: [ '.js', '.jsx' ]
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].js'
    },
    devtool: isProduction ? 'source-map' : 'cheap-module-eval-source-map',
    module: {
        rules: [ {
            test: /\.css$/,
            use: [ {
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: { sourceMap: true, importLoaders: 1 }
            }, {
                loader: 'postcss-loader',
                options: { sourceMap: true, plugins: [ autoprefixer(config.getOption('targets')) ] }
            } ]
        }, {
            test: /\.less$/,
            use: [ {
                loader: 'style-loader'
            }, {
                loader: 'css-loader',
                options: { sourceMap: true, importLoaders: 1 }
            }, {
                loader: 'postcss-loader',
                options: { sourceMap: true, plugins: [ autoprefixer(config.getOption('targets')) ] }
            }, {
                loader: 'less-loader',
                options: { sourceMap: true }
            } ]
        }, {
            test: /\.(gif|png|jpg|svg|eot|woff|woff2|ttf|mp4|cur)$/,
            loader: 'file-loader'
        } ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        }),
        new webpack.ProvidePlugin({
            'React': 'react',
        }),
        new webpack.optimize.UglifyJsPlugin({ sourceMap: !isProduction }),
        config,
        new HtmlWebpackPlugin({ title: 'sample-project' })
    ]
};
