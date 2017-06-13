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

var fetch = require('isomorphic-fetch');

exports.ERRTMOUT = { code: 500, status: 500, statusText: 'Timeout' };

exports.create = function( baseURL, defaults ) {
	var _baseURL = baseURL !== undefined ? baseURL : '';
	var _defaults = defaults !== undefined ? defaults : {};
	var withoutBody = function( method ) {
		return function( endpoint, options ) {
			var _options = options !== undefined ? options : {};
			var config = Object.assign({
				cache: 'no-store',
				credentials: 'same-origin',
				method: method,
				mode: 'same-origin',
				redirect: 'follow'
			}, _defaults, _options, {
				headers: Object.assign({}, {
					'Accept': 'application/json'
				}, _defaults.headers || {}, _options.headers || {} )
			});
			var call = fetch( _baseURL + endpoint, config );
			if ( !_options.timeout )
				return call;
			var timeout = new Promise( function( resolve, reject ) {
				setTimeout( function() {
					reject( exports.ERRTMOUT );
				}, _options.timeout );
			});
			return Promise.race([ call, timeout ]);
		};
	};
	var withBody = function( method ) {
		return function( endpoint, body, options, stringify ) {
			var _options = options !== undefined ? options : {};
			var _stringify = stringify !== undefined ? stringify : true;
			var config = Object.assign({
				cache: 'no-store',
				credentials: 'same-origin',
				method: method,
				mode: 'same-origin',
				redirect: 'follow'
			}, _defaults, _options, {
				headers: Object.assign({}, {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}, _defaults.headers || {}, _options.headers || {} ),
				body: _stringify ? JSON.stringify( body ) : body
			});
			var call = fetch( _baseURL + endpoint, config );
			if ( !_options.timeout )
				return call;
			var timeout = new Promise( function( resolve, reject ) {
				setTimeout( function() {
					reject( exports.ERRTMOUT );
				}, _options.timeout );
			});
			return Promise.race([ call, timeout ]);
		};
	};
	return {
		'get': withoutBody('GET'),
		'put': withBody('PUT'),
		'post': withBody('POST'),
		'head': withoutBody('HEAD'),
		'patch': withBody('PATCH'),
		'delete': withoutBody('DELETE'),
		'options': withoutBody('OPTIONS')
	};
};

exports.uuid = function( ) {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};
