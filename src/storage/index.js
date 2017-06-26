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

function Storage() { }

Storage.prototype.set = function(/* userID, key, value */) {
	throw new Error('Storage.prototype.set must be overridden.');
};

Storage.prototype.get = function(/* userID, key, fallback */) {
	throw new Error('Storage.prototype.get must be overridden.');
};

Storage.prototype.getKeys = function(/* userID, keys */) {
	throw new Error('Storage.prototype.getKeys must be overridden.');
};

Storage.prototype.getUser = function(/* userID */) {
	throw new Error('Storage.prototype.getUser must be overridden.');
};

Storage.prototype.has = function(/* userID, key */) {
	throw new Error('Storage.prototype.has must be overridden.');
};

Storage.prototype.clear = function(/* userID, key */) {
	throw new Error('Storage.prototype.clear must be overridden.');
};

Storage.prototype.clearUser = function(/* userID */) {
	throw new Error('Storage.prototype.clearUser must be overridden.');
};

Storage.prototype.clearAll = function() {
	throw new Error('Storage.prototype.clearAll must be overridden.');
};

Storage.prototype.delete = function(/* userID, key */) {
	throw new Error('Storage.prototype.delete must be overridden.');
};

Storage.prototype.forEach = function(/* userID, iterator, context */) {
	throw new Error('Storage.prototype.forEach must be overridden.');
};

module.exports = Storage;
