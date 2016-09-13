
module.exports = ( typeof window !== 'undefined' )
	? require('./lib/web')
	: require('./lib/node');
