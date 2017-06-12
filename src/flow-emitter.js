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

function FlowEmitter() {
	this.listeners = {};
}

FlowEmitter.prototype.subscribe = function( event, listener ) {
	if ( !this.listeners[ event ] )
		this.listeners[ event ] = [];
	this.listeners[ event ].push( listener );
	return function unsubscribe() {
		var index = this.listeners[ event ].indexOf( listener );
		if ( index == -1 )
			return;
		var removed = this.listeners[ event ].splice( index, 1 );
		return removed;
	}.bind( this );
};

FlowEmitter.prototype.subscribeAll = function( listeners ) {
	return Object.keys( listeners ).reduce( function( result, event ) {
		result[ event ] = this.subscribe( event, listeners[ event ]);
		return result;
	}.bind( this ), { });
};

FlowEmitter.prototype.emit = function( event ) {
	var args = Array.prototype.slice.call( arguments, 1 );
	var listeners = this.listeners[ event ] || [];
	var results = listeners.map( function( listener ) {
		return listener.apply( null, args );
	});
	return Promise.all( results ).then( function() {
		return args[0];
	});
};

module.exports = FlowEmitter;
