
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
