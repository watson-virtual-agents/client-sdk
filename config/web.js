/**
* (C) Copyright IBM Corp. 2016. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not
* use this file except in compliance with the License. You may obtain a copy of
* the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations under
* the License.
*/

const path = require('path');
const Webpack = require('webpack');

const { NoErrorsPlugin } = Webpack;
const {
	DedupePlugin,
	UglifyJsPlugin,
	OccurenceOrderPlugin } = Webpack.optimize;

const pkg = require('../package.json');
const env = process.env.NODE_ENV || 'development';
const debug = ( env === 'development' );

const paths = {
	'context': path.resolve( __dirname, '..'),
	'entry': path.resolve( __dirname, '..', 'src', 'sdk.js'),
	'output': path.resolve( __dirname, '..', 'lib')
};

const postplugins = !debug
	? [ new DedupePlugin(),
		new UglifyJsPlugin({ mangle: true, sourcemap: false }) ]
	: [ new NoErrorsPlugin() ];

module.exports = [
	{
		name: 'web',
		target: 'web',
		
		debug: debug,
		cache: debug,
		devtool: debug ? 'inline-sourcemap' : null,
		stats: { colors: true },
		node: {
			__filename: true,
			__dirname: true
		},
		resolve: {
			extensions: ['', '.js']
		},
		
		env: env,
		context: paths.context,
		entry: { 'web': [ paths.entry ] },
		output: {
			path: paths.output,
			filename: '[name].js',
			library: 'SDK',
			libraryTarget: 'umd',
			umdNamedDefine: true
		},
		module: {
			preLoaders: [ {
				loader: 'eslint',
				test: /\.js$/,
				exclude: /node_modules/
			} ],
			loaders: [
				{	loader: 'json',
					test: /\.json$/
				}
			]
		},
		plugins: [
			new OccurenceOrderPlugin( true ),
			...postplugins
		]
	}
];
