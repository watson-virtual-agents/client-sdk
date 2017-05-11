
exports.create = function( baseURL, defaults ) {
	var _baseURL = typeof baseURL !== undefined ? baseURL : '';
	var _defaults = typeof defaults !== undefined ? defaults : {};
	// var withoutBody = function( method ) {
	// 	return function( endpoint, options ) {
	// 		var _options = typeof options !== undefined ? options : {};
	// 		var config = Object.assign({
	// 			cache: 'no-store',
	// 			credentials: 'same-origin',
	// 			method: method,
	// 			mode: 'same-origin',
	// 			redirect: 'follow'
	// 		}, _defaults, _options, {
	// 			headers: Object.assign({}, {
	// 				'Accept': 'application/json'
	// 			}, _defaults.headers || {}, _options.headers || {} )
	// 		});
	// 		return fetch( _baseURL + endpoint, config );
	// 	};
	// };
	var withBody = function( method ) {
		return function( endpoint, body, options, stringify ) {
			var _options = typeof options !== undefined ? options : {};
			var _stringify = typeof stringify !== undefined ? stringify : true;
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
			return fetch( _baseURL + endpoint, config );
		};
	};
	return {
		// get: withoutBody('GET'),
		// put: withBody('PUT'),
		post: withBody('POST')
		// head: withoutBody('HEAD'),
		// patch: withBody('PATCH'),
		// delete: withoutBody('DELETE'),
		// options: withoutBody('OPTIONS')
	};
};

exports.uuid = function( ) {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};
