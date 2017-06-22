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

var API = require('./api');
var FlowEmitter = require('./flow-emitter');
var Storage = require('./storage');
var MemoryStorage = require('./storage/memory');

var IDENTITY = function( o ) { return o; };
var PROFILE_REGEX = /\|&(.*?)\|/g;
var DEFAULTS = {
	agentID: null,
	baseURL: 'https://api.ibm.com/virtualagent/run/api/v2',
	clientID: false,
	clientSecret: false,
	context: {},
	credentials: 'same-origin',
	preprocess: IDENTITY,
	timeout: 30 * 1000
};

function SDK( config, storage ) {
	FlowEmitter.call( this );
	var options = Object.assign({ }, DEFAULTS, config );
	this.storage = storage || new MemoryStorage();
	this._options = options;
	this._api = API.create( options.baseURL, {
		credentials: options.credentials,
		timeout: options.timeout,
		headers: ( options.clientID && options.clientSecret ) ? {
			'X-IBM-Client-Id': options.clientID,
			'X-IBM-Client-Secret': options.clientSecret
		} : { }
	});
}

SDK.prototype = Object.create( FlowEmitter.prototype );
SDK.prototype.constructor = SDK;

SDK.prototype.start = function( userID, context ) {
	var self = this;
	var agentID = self._options.agentID;
	var _context = context === undefined ? {} : context;
	var endpoint = '/bots/'+ agentID +'/messages';
	var requestID = API.uuid();
	var config = {
		'headers': { 'X-Request-ID': requestID },
		'timeout': self._options.timeout
	};
	var body = {
		input: { text: "" },
		context: _context
	};
	return self
		.emit('starting')
		.then( function() {
			return self._api.post( endpoint, body, config );
		})
		.then( function( res ) {
			if ( !res.ok )
				throw res;
			return res.json();
		})
		.then( function( message ) {
			var conversationID = message.context['conversation_id'];
			return self
				.storage
				.set( userID, '__conversationID__', conversationID )
				.then( function() {
					return self.emit('started', message.context );
				})
				.then( function() {
					return self.emit('raw', message );
				})
				.then( function() {
					return self.parse( userID, message );
				})
				.then( function( parsed ) {
					return self.emit('response', parsed );
				});
		})['catch']( function( err ) {
			console.error( err );
			if ( err == API.ERRTMOUT )
				self.emit('timeout', err, requestID );
			else
				self.emit('error', err, requestID );
			throw err;
		});
};

SDK.prototype.send = function( userID, message, context ) {
	var self = this;
	var _context = context === undefined ? {} : context;
	var agentID = self._options.agentID;
	var requestID = API.uuid();
	var config = {
		'headers': { 'X-Request-ID': requestID },
		'timeout': self._options.timeout
	};
	return self
		.storage
		.get( userID, '__conversationID__', null )
		.then( function( conversationID ) {
			return self.emit('sending', {
				input: {
					text: message
				},
				context: Object.assign({}, {
					'conversation_id': conversationID
				}, _context )
			});
		})
		.then( function( body ) {
			return self._options.preprocess( body );
		})
		.then( function( req ) {
			return self.emit('request', req );
		})
		.then( function( req ) {
			var endpoint = '/bots/'+ agentID +'/messages';
			return self._api.post( endpoint, req, config );
		})
		.then( function( res ) {
			if ( !res.ok )
				throw res;
			return res.json();
		})
		.then( function( message ) {
			return self.emit('raw', message );
		})
		.then( function( message ) {
			return self.parse( userID, message );
		})
		.then( function( parsed ) {
			return self.emit('response', parsed );
		})['catch']( function( err ) {
			var errEvent = ( err == API.ERRTMOUT ) ? 'timeout' : 'error';
			return self.emit( errEvent, err, requestID ).then( function() {
				throw err;
			});
		});
};

SDK.prototype.parse = function( userID, msg ) {
	var self = this;
	var isString = ( typeof msg === 'string' );
	var msgString = isString ? msg : JSON.stringify( msg );
	var matches = ( msgString.match( PROFILE_REGEX ) || [] );
	var storeCalls = matches.map( function( match ) {
		var name = match.slice( 2, -1 );
		return self.storage.get( userID, name, name );
	});
	return Promise.all( storeCalls ).then( function( values ) {
		var flattened = matches.reduce( function( result, match, index ) {
			var value = values[ index ];
			return result.replace( match, value );
		}, msgString );
		var message = isString ? flattened : JSON.parse( flattened );
		return message;
	});
};

SDK.prototype.generate = function( output ) {
	return {
		output: {
			text: output
		}
	};
};

exports.SDK = SDK;
exports.Storage = Storage;
exports.MemoryStorage = MemoryStorage;
