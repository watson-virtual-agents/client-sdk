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

var Storage = require('./');

function MemoryStorage() {
	Storage.call( this );
	this._data = {};
}

MemoryStorage.prototype = Object.create( Storage.prototype );
MemoryStorage.prototype.constructor = MemoryStorage;

MemoryStorage.prototype._getUser = function( userID ) {
	if ( !this._data[ userID ] )
		this._data[ userID ] = {};
	return this._data[ userID ];
};

MemoryStorage.prototype.set = function( userID, key, value ) {
	var user = this._getUser( userID );
	user[key] = value;
	return this;
};

MemoryStorage.prototype.get = function( userID, key ) {
	return this._getUser( userID )[ key ] || '';
};

MemoryStorage.prototype.has = function( userID, key ) {
	return ( this._getUser( userID )[ key ] !== undefined );
};

MemoryStorage.prototype.clear = function( userID ) {
	this._data[ userID ] = {};
	return this;
};

MemoryStorage.prototype.delete = function( userID, key ) {
	var user = this._getUser( userID );
	delete user[ key ];
	return this;
};

MemoryStorage.prototype.forEach = function( userID, iterator, context ) {
	var user = this._getUser( userID );
	Object.keys( user ).forEach( function( key ) {
		if ( context )
			iterator.call( context, key, user[ key ]);
		else
			iterator( key, user[ key ]);
	});
	return this;
};

module.exports = MemoryStorage;
