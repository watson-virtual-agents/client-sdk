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

const FileSystem = require('fs');
const Path = require('path');
const Webpack = require('webpack');

const { name, version } = require('../package.json');

const {
	LoaderOptionsPlugin,
	NamedModulesPlugin,
	NoEmitOnErrorsPlugin,
	optimize: {
		UglifyJsPlugin
	}
} = Webpack;
const { NODE_ENV = 'local' } = process.env;

const isLocal = ( NODE_ENV === 'local' );
const isProduction = ( NODE_ENV === 'production' );

const root = Path.resolve( __dirname, '..');
const paths = {
	'source': Path.join( root, 'src'),
	'entry': Path.join( root, 'src', 'sdk.js'),
	'modules': Path.join( root, 'node_modules'),
	'output': Path.join( root, 'lib')
};

const externalModules = FileSystem
	.readdirSync( paths.modules )
	.reduce(( modules, module )=> {
		if ( module !== '.bin' )
			modules[module] = true
		return modules;
	}, {});
const externalModulesTransform = ( context, request, callback )=> {
	// Match for root modules that are in our node_modules
	if ( externalModules.hasOwnProperty( request ))
		callback( null, `commonjs ${request}`);
	else
		callback();
};


module.exports = {
	bail: !isLocal,
	devtool: isProduction ? false : 'eval-source-map',
	context: paths.source,
	target: 'node',
	entry: {
		'node': [
			paths.entry
		]
	},
	output: {
		filename: '[name].js',
		chunkFilename: '[name]-[id].js',
		path: paths.output,
		devtoolModuleFilenameTemplate: '[absolute-resource-path]',
		library: 'SDK',
		libraryTarget: 'commonjs2'
	},
	externals: externalModulesTransform,
	module: {
		rules: [
			...( isLocal ? [{
				enforce: 'pre',
				test: /\.js$/,
				loader: 'eslint-loader',
				exclude: /node_modules/
			}] : [])
		]
	},
	plugins: [
		...( !isLocal ? [
			new LoaderOptionsPlugin({
				minimize: true,
				debug: false
			}),
			new UglifyJsPlugin({
				'sourceMap': true,
				'compressor': {
					'warnings': false,
					'screw_ie8': true,
					'conditionals': true,
					'unused': true,
					'comparisons': true,
					'sequences': true,
					'dead_code': true,
					'evaluate': true,
					'if_return': true,
					'join_vars': true
				},
				'mangle': {
					'screw_ie8': true
				},
				'output': {
					'comments': false,
					'screw_ie8': true
				}
			})
		] : []),
		...( isLocal ? [
			new NamedModulesPlugin(),
			new NoEmitOnErrorsPlugin()
		] : [])
	]
};
