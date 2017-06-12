
const BodyParser = require('body-parser');
const HTTP = require('http');
const Express = require('express');
const Path = require('path');
const WVA = require('../../lib/node'); // require('@watson-virtual-agent/client-sdk');
// const RedisStorage = require('@watson-virtual-agent/redis-storage');

// Mock services
const Pay = require('./services/pay');
const Geo = require('./services/geo');

const app = Express();
const server = HTTP.createServer( app );
const wva = new WVA.SDK({
	// baseURL: 'https://dev.api.ibm.com/virtualagent/development/api/v1/',
	agentID: '18021dd8-498d-4cf5-ab65-3a22fd1c02f2',//process.env.WVA_AGENT_ID,
	clientID: '40933a4e-cb47-4c4e-b38b-af3f6546ca3e',//process.env.WVA_CLIENT_ID,
	clientSecret: 'I0hT6tL6lT7yD0tX8nL8xN0tH7qK7eS5lU8yF8fD5kU1vG8cX0'//process.env.WVA_CLIENT_SECRET
}/*, new RedisStorage() */);

wva.subscribeAll({
	'starting': async ()=> {
		console.log('Starting...');
	},
	'started': async chatID => {
		console.log('Started: ', chatID );
	},
	'sending': async ()=> {
		console.log('Sending...');
	},
	'request': async req => {
		console.log('Request: ', req );
	},
	'raw': async body => {
		console.log('Unparsed: ', body );
	},
	'response': async res => {
		console.log('Response: ', res );
		console.log( res.message.inputvalidation );
	},
	'timeout': async err => {
		console.log('Timeout:', err );
	},
	'error': async err => {
		if ( err instanceof Response && !err.usedBody ) {
			const text = await err.text();
			console.error( text );
			return;
		}
		console.error( err );
	}
});

app.use( Express.static( Path.join( __dirname, 'public')));

app.post('/chat', BodyParser.json(), async ( req, res )=> {
	const { userID, message } = req.body;
	try {
		// Get ChatID and Processing Flag from WVA SDK
		const chatID = await wva.storage.get( userID, '__chatID__', null );
		const isProcessing = await wva.storage.get( userID, '__processing__', false );
		
		// If Processing Flag is set, do not process new input.  Set Flag.
		if ( isProcessing ) {
			const response = wva.generate(['The Agent is still typing...']);
			res.status( 409 );
			res.json( response.message );
			return;
		}
		await wva.storage.set( userID, '__processing__', true );
		
		const startChat = async ()=> {
			// Start a WVA Chat
			const response = await wva.start( userID );
			onResponse( response );
		};
		
		const processInput = async ()=> {
			// If User Input Is Empty, Send Last Response
			if ( message === '%__start__%' ) {
				const lastMessages = await wva.storage.get( userID, '__last__', 'Hello <Figure This Out>');
				const response = wva.generate( lastMessages );
				onResponse( response );
				return;
			}
			
			// Process User Input
			const mode = await wva.storage.get( userID, '__mode__');
			
			// If User Input Is 'agent', ~connect to agent~ (display nonsense).
			if ( mode !== 'storing' && message.toLowerCase() === 'agent' ) {
				const response = wva.generate([
					'Connecting to Agent...',
					'Agent didn\'t want to talk to you.',
					'Continue conversing with me for now.'
				]);
				onResponse( response );
				return;
			}
			
			// If User Input Is NOT a Command, Send To WVA
			if ( mode !== 'storing' ) {
				const response = await wva.send( userID, message/*, context */);
				onResponse( response );
				return;
			}
			
			// In Storing Mode
			const store = await wva.storage.get( userID, '__store__');
			const step = await wva.storage.get( userID, '__step__', 0 );
			if ( message.toLowerCase() == 'help' ) {
				const response = wva.generate([
					'Variable Input Help:\n\n' +
					'Type \'back\' to return to last input.\n' +
					'Type \'cancel\' to cancel this form.\n\n' +
					`Enter ${store[step].label} >`
				]);
				onResponse( response );
				return;
			}
			if ( message.toLowerCase() == 'cancel' ) {
				await wva.storage.clear( userID, '__mode__');
				await wva.storage.clear( userID, '__step__');
				await wva.storage.clear( userID, '__store__');
				const response = await wva.send( userID, 'cancel');
				onResponse( response );
				return;
			}
			if ( message.toLowerCase() == 'back' ) {
				if ( step === 0 ) {
					const response = wva.generate([
						'There is no previous input to go back to.'
					]);
					onResponse( response );
					return;
				}
				const prevStep = step - 1;
				await wva.storage.set( userID, '__step__', prevStep );
				const response = wva.generate([`Enter ${store[prevStep].label} >`]);
				onResponse( response );
				return;
			}
			const nextStep = step + 1;
			// Validate
			await wva.storage.set( userID, store[step].name, message );
			if ( nextStep < store.length ) {
				await wva.storage.set( userID, '__step__', nextStep );
				const response = wva.generate([`Enter ${store[nextStep].label} >`]);
				onResponse( response );
				return;
			}
			await wva.storage.clear( userID, '__mode__');
			await wva.storage.clear( userID, '__step__');
			await wva.storage.clear( userID, '__store__');
			const response = await wva.send( userID, 'success');
			onResponse( response );
		};
		
		const onResponse = async ( response )=> {
			// Handle Response
			const action = response.message.action;
			if ( action ) {
				switch ( action.name ) {
					case 'getUserProfileVariables':
						actionGetProfile( userID );
						return;
					case 'payBill':
						actionPayBill( userID );
						return;
					case 'getLocation':
						actionGetLocation( userID );
						return;
					default:
						actionDefault( userID );
						return;
				}
			}
			if ( response.message.store ) {
				const store = response.message.store;
				await wva.storage.set( userID, '__store__', store );
				await wva.storage.set( userID, '__step__', 0 );
				await wva.storage.set( userID, '__mode__', 'storing');
				const input = wva.generate([
					`Please fill out the following:`,
					`Type 'help' to see a list of commands`,
					`Enter ${store[0].label} >`
				]);
				sendResponse( input );
				return;
			}
			sendResponse( response );
		};
		
		const sendResponse = async ( response )=> {
			const message = response.message;
			const layout = message.layout;
			if ( layout ) {
				switch ( layout.name ) {
					case 'choose':
					case 'confirm':
						message.text.push('Please type one of the following:');
						message.inputvalidation.oneOf.forEach( option => {
							message.text.push(`- ${option}`)
						});
						break;
					case 'choose-location-type':
						wva.send( userID, 'zipcode').then( onResponse );
						return;
					case 'show-locations':
						message.data.location_data.forEach(( location, index )=> {
							message.text.splice( 1 + ( index * 2 ), 0, `${index + 1}. ${location.label}\n`);
							message.text.splice( 2 + ( index * 2 ), 0, `  ${location.address.address}\n\n`);
						});
						break;
				}
			}
			await wva.storage.set( userID, '__last__', message.text );
			res.status( 200 );
			res.json( response.message );
		};
		
		const actionGetProfile = ( userID )=> {
			return wva.storage.set( userID, 'bill_amount', 42.15 )
				.then(()=> wva.storage.set( userID, 'payment_due_date', '01/01/2999'))
				.then(()=> wva.send( userID, 'success'))
				.catch( err => wva.send( userID, 'failure'))
				.then( onResponse );
		};
		
		const actionPayBill = ( userID )=> {
			return wva.storage
				.getKeys( userID, ['cc_number', 'cc_full_name', 'cc_exp_date', 'cc_code'])
				.then( ccData => Pay.send( userID, ccData ))
				.then( result => wva.storage.set( userID, 'balance', result.balance ))
				.then(()=> wva.send( userID, 'success'))
				.catch( err => wva.send( userID, 'failure'))
				.then( onResponse );
		};
		
		const actionGetLocation = ( userID )=> {
			return Geo.find( userID )
				.then( result => wva.storage.set( userID, 'location', result.coords ))
				.then(()=> wva.send( userID, 'success'))
				.catch( err => wva.send( userID, 'failure'))
				.then( onResponse );
		};
		
		const actionDefault = ( userID )=> {
			return wva.send( userID, 'success').then( onResponse );
		};
		
		if ( !chatID )
			startChat();
		else
			processInput();
	}
	catch ( err ) {
		console.error( err );
		if ( err )
			res.status( err.status ).send( err.message );
		else
			res.status( 500 ).send('Internal Server Error.');
	}
	finally {
		await wva.storage.clear( userID, '__processing__');
	}
});

app.use(( req, res )=> {
	res.status( 404 );
	res.end();
});

server.listen( process.env.PORT || 1337, ()=> {
	console.log(`Server listening on port ${server.address().port}`);
});
