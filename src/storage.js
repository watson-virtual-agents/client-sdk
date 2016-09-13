var profile = {};
var storage = {
	set: function(key, value) {
		profile[key] = value;
		return storage;
	},
	get: function(key) {
		return profile[key] || '';
	},
	has: function(key) {
		return (profile[key] !== undefined);
	},
	clear: function() {
		profile = {};
		return storage;
	},
	delete: function(key) {
		delete profile[key];
		return storage;
	},
	forEach: function(cb, context) {
		Object.keys(profile).forEach(function(key) {
			if (context)
				cb(key, profile[key]).bind(context);
			else
				cb(key, profile[key]);
		});
		return storage;
	}
};

module.exports = storage;
