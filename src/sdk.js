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

if ( typeof Promise === 'undefined' ) require('es6-promise').polyfill();

var assign = require('lodash.assign');
var axios = require('axios');
var storage = require('./storage');

var options = {
	baseURL: 'https://dev.api.ibm.com/virtualagent/development/api/v1/',
	timeout: 30 * 1000,
	userID: null,
	withCredentials: false,
	XIBMClientID: false,
	XIBMClientSecret: false
};

var api = axios.create( options );

var profileDataRe = /\|&(.*?)\|/g;
var insertUserProfileData = function(msg) {
	var flatten = (typeof msg === 'string') ? msg : JSON.stringify(msg);
	var matches = (flatten.match(profileDataRe) || []);
	flatten = matches.reduce(function(result, prof) {
		const name = prof.slice( 2, -1 );
		const value = storage.get(name) || name;
		return result.replace( prof, value );
	}, flatten);
	return (typeof msg === 'string') ? flatten : JSON.parse(flatten);
};

/**
 * @namespace SDK
 */

var SDK = module.exports = {
	/**
	 * Configure the Client SDK
	 * @function configure
	 * @memberof SDK
	 * @param {Object} config
	 * @param {string} config.baseURL=https://dev.api.ibm.com/virtualagent/development/api/v1/ - Optional: The URL the SDK should prepend to requests.
	 * @param {int} config.timeout=30000 - Optional: How long requests should wait before they error.
	 * @param {string} config.userID - Optional: A user identifier, transformed by a one-way hashing algorithm. Used by your Metrics Dashboard to track usage.
	 * @param {string} config.userLatLon - Optional: lat,lon or user ( eg. 28.3852,-81.5639 ). Used by your Metrics Dashboard to track usage.
	 * @param {string} config.withCredentials - Optional: indicates whether or not cross-site Access-Control requests should be made using credentials
	 * @param {string} config.XIBMClientID - Optional: Your X-IBM-Client-Id. This should not be made public in a public environment. Including this will add X-IBM-Client-Id as a header to your request.
	 * @param {string} config.XIBMClientSecret - Optional: Your X-IBM-Client-Secret. This should not be made public in a public environment. Including this will add X-IBM-Client-Secret as a header to your request.
	 * @example
	 * SDK.configure({
	 *   baseURL: 'https://server.mysite.com',
	 *   userID: 'poiuytrewq',
	 *   userLatLon: '28.3852,-81.5639'
	 * });
	 * @returns {SDK} Returns: The SDK singleton
	 */
	configure: function( config ) {
		assign( options, config );
		api = axios.create({
			baseURL: options.baseURL,
			timeout: options.timeout,
			withCredentials: options.withCredentials,
			headers: (options.XIBMClientID && options.XIBMClientSecret) ? {
				'X-IBM-Client-Id': options.XIBMClientID,
				'X-IBM-Client-Secret': options.XIBMClientSecret
			} : {}
		});
		return SDK;
	},
	/**
	 * Start a new chat session
	 * @function start
	 * @memberof SDK
	 * @param {string} botID - Your botID.
	 * @example
	 * SDK.start(botID)
	 *    .then(function(res) {
	 *      console.log(res.chatID, res.message);
	 *    })
	 *    .catch(function(err) {
	 *      console.error(err);
	 *    });
	 * @returns {Promise({ chatID: "string", message: "string" })} Returns: A Promise that resolves when the chat session is started.
	 */
	start: function( botID ) {
		var requestID = uuid();
		var data = { userID: options.userID, userLatLon: options.userLatLon };
		var endpoint = '/bots/'+ botID +'/dialogs';
		var config = { 'headers': { 'X-Request-ID': requestID } };
		return api
			.post( endpoint, data, config )
			.then( function( res ) {
				return {
					chatID: res.data.dialog_id,
					message: insertUserProfileData(res.data.message)
				};
			})['catch']( function( err ) {
				console.error('Request failed:', requestID );
				onError( err );
			});
	},
	/**
	 * Send a message to a chat session
	 * @function send
	 * @memberof SDK
	 * @param {string} botID - Your botID
	 * @param {string} chatID - Your chatID provided by SDK.start
	 * @param {string} message - Your message
	 * @param {Object} context - (optional) Context variables to pass to your [Custom Workspaces](https://www.ibm.com/watson/developercloud/doc/conversation/dialog-build.html#context-variables)
	 * @example
	 * SDK.send(botID, chatID, 'Hello!')
	 *    .then(function(data) {
	 *      console.log(data.message);
	 *    })
	 *    .catch(function(err) {
	 *      console.error(err);
	 *    });
	 * @returns {Promise({ message: "string" })} Returns: A Promise that resolves when the bot responds.
	 */
	send: function( botID, chatID, message, context ) {
		var requestID = uuid();
		var data = { message: message, userID: options.userID, userLatLon: options.userLatLon, context: context };
		var endpoint = '/bots/'+ botID +'/dialogs/'+ chatID +'/messages';
		var query = 'message='+ encodeURIComponent( message );
		var config = { 'headers': { 'X-Request-ID': requestID } };
		return api
			.post( endpoint +'?'+ query, data, config )
			.then( function( res ) {
				return {
					message: insertUserProfileData(res.data.message)
				};
			})['catch']( function( err ) {
				console.error('Request failed:', requestID );
				onError( err );
			});
	},
	/**
	* Iterate profile data into a given message object.
	* @memberof SDK
	* @function parse
	* @param {Any} message - A string or message object to insert profile data into.
	* @returns {Any} Returns: The message in original format with variables replaced.
	* @example
	* var message = "You owe |&bill_amount|.";
	* var parsed = SDK.parse(message);
	*/
	parse: insertUserProfileData,
	/**
	 * @namespace profile
	 * @memberof SDK
	 */
	profile: {
		/**
		* Get an item from the user profile based on key.
		* @memberof SDK.profile
		* @function get
		* @param {string} key - The named key of the value you are accessing.
		* @example
		* SDK.profile.get('first_name');
		* @returns {Any} Returns: the value of the key in the profile map.
		*/
		get: storage.get,
		/**
		* Set an item from the user profile based on key.
		* @memberof SDK.profile
		* @function set
		* @param {string} key - The named key of the value you are setting.
		* @param {string} value - The value you are setting.
		* @returns {Object} Returns: An instance of SDK.profile for chaining.
		* @example
		* SDK.profile.set('first_name', 'john');
		*/
		set: storage.set,
		/**
		* See if an item from the user profile exists based on key.
		* @memberof SDK.profile
		* @function has
		* @param {string} key - The named key of the value you are checking the existance of.
		* @example
		* SDK.profile.has('first_name');
		* @returns {Boolean} Returns: Boolean indicating if the key exists.
		*/
		has: storage.has,
		/**
		* Clear the entire user profile.
		* @memberof SDK.profile
		* @function clear
		* @returns {Object} Returns: An instance of SDK.profile for chaining.
		* @example
		* SDK.profile.clear();
		*/
		clear: storage.clear,
		/**
		* Delete an item from the user profile based on key.
		* @memberof SDK.profile
		* @function delete
		* @returns {Object} Returns: An instance of SDK.profile for chaining.
		* @param {string} key - The named key of the value you are deleting.
		* @example
		* SDK.profile.delete('first_name');
		*/
		delete: storage.delete,
		/**
		* Iterate over the profile.
		* @memberof SDK.profile
		* @function forEach
		* @param {function} callback - The function you are calling on each item in the profile object. This function is passed key as the first argument and value as the second argument.
		* @param {Object} this - (optional) The context you wish to call the callback in.
		* @returns {Object} Returns: An instance of SDK.profile for chaining.
		* @example
		* SDK.profile.forEach(function(key, value) {
		*   console.log(key, value);
		* });
		*/
		forEach: storage.forEach
	}
};

var uuid = function( ) {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

var onError = function( err ) {
	if ( !err.status )
		throw err;
	var status = err.status;
	var statusText = err.statusText;
	var error = new Error( statusText );
	error.status = status;
	throw error;
};
