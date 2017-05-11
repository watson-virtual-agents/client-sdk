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
var MemoryStorage = require('./storage/memory');

var PROFILE_REGEX = /\|&(.*?)\|/g;
var DEFAULTS = {
	baseURL: 'https://dev.api.ibm.com/virtualagent/development/api/v1/',
	clientID: false,
	clientSecret: false,
	credentials: 'same-origin',
	timeout: 30 * 1000,
	onError: function( err, requestID ) {
		console.error('Request failed:', requestID );
		if ( !err.status )
			throw err;
		var status = err.status;
		var statusText = err.statusText;
		var error = new Error( statusText );
		error.status = status;
		throw error;
	}
};

function SDK( options, storage ) {
	this.storage = storage || new MemoryStorage();
	this._options = options;
	this._api = API.create( options.baseURL, {
		credentials: options.credentials,
		timeout: options.timeout,
		headers: {
			'X-IBM-Client-Id': options.clientID,
			'X-IBM-Client-Secret': options.clientSecret
		}
	});
}

SDK.prototype.start = function( agentID, botID, user ) {
	var endpoint = '/bots/'+ botID +'/dialogs';
	var requestID = API.uuid();
	var config = { 'headers': { 'X-Request-ID': requestID } };
	var data = {
		userID: user.id,
		userLatLon: user.location
	};
	var call = this._api.post(, data, config );
	var timeout = new Promise( function( resolve, reject ) {
		setTimeout( reject, this._options.timeout );
	}.bind( this ));
	return Promise
		.race([ call, timeout ])
		.then( function( res ) {
			if ( !res.ok )
				throw res;
			return res.json();
		})
		.then( function( data ) {
			return {
				chatID: data.dialog_id,
				message: this.parse( data.message )
			};
		}.bind( this ))['catch']( function( err ) {
			this._options.onError( err, requestID );
		}.bind( this ));
};

SDK.prototype.send = function( agentID, botID, chatID, message, context, user ) {
	var endpoint = '/bots/'+ botID +'/dialogs/'+ chatID +'/messages';
	var requestID = API.uuid();
	var config = { 'headers': { 'X-Request-ID': requestID } };
	var data = {
		context: context,
		message: message,
		userID: user.id,
		userLatLon: user.location
	};
	var call = this._api.post( endpoint, data, config );
	var timeout = new Promise( function( resolve, reject ) {
		setTimeout( reject, this._options.timeout );
	}.bind( this ));
	return Promise
		.race([ call, timeout ])
		.then( function( res ) {
			if ( !res.ok )
				throw res;
			return res.json();
		})
		.then( function( data ) {
			return {
				message: this.parse( data.message )
			};
		}.bind( this ))['catch']( function( err ) {
			this._options.onError( err, requestID );
		}.bind( this ));
};

SDK.prototype.parse = function( msg ) {
	var message = ( typeof msg === 'string' ) ? msg : JSON.stringify( msg );
	var matches = ( message.match( PROFILE_REGEX ) || [] );
	var flattened = matches.reduce( function( result, match ) {
		const name = match.slice( 2, -1 );
		const value = this.storage.get( name ) || name;
		return result.replace( match, value );
	}.bind( this ), message );
	return ( typeof msg === 'string' ) ? flattened : JSON.parse( flattened );
};

exports.create = function( config ) {
	var options = Object.assign({ }, DEFAULTS, config );
	return new SDK( options );
};

exports.MemoryStorage = MemoryStorage;
