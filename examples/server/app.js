
const BodyParser = require('body-parser');
const HTTP = require('http');
const Express = require('express');
const Path = require('path');
const WVA = require('../../lib/node'); // require('@watson-virtual-agent/client-sdk');
// const RedisStorage = require('@watson-virtual-agent/redis-storage');
// TODO: Create a Redis Storage connector for distributed servers.

const {
	BASE_URL = 'https://api.ibm.com/virtualagent/run/api/v1',
	DEBUG = false,
	PORT = 1337,
	WVA_AGENT_ID,
	WVA_CLIENT_ID,
	WVA_CLIENT_SECRET
} = process.env;

// Mock services
const Geo = require('./services/geo');
const Pay = require('./services/pay');
const User = require('./services/user');

const app = Express();
const server = HTTP.createServer( app );
const wva = new WVA.SDK({
	baseURL: BASE_URL,
	agentID: WVA_AGENT_ID,
	clientID: WVA_CLIENT_ID,
	clientSecret: WVA_CLIENT_SECRET
}/*, new RedisStorage() */);

DEBUG && wva.subscribeAll({
	'starting': ()=> {
		console.log('Starting...');
	},
	'started': chatID => {
		console.log('Started: ', chatID );
	},
	'sending': ()=> {
		console.log('Sending...');
	},
	'request': req => {
		console.log('Request: ', req );
	},
	'raw': body => {
		console.log('Unparsed: ', body );
	},
	'response': res => {
		console.log('Response: ', res );
	},
	'timeout': err => {
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

// Serve Client Files
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
			console.log( 2 );
			const response = await wva.start( userID, { balance: 41.25 });
			onResponse( response );
		};
		
		const processInput = async ()=> {
			console.log( 3 );
			// If User Input Is Empty, Send Last Response
			if ( message === '%__start__%' ) {
				const lastMessages = await wva.storage.get( userID, '__last__', 'Hello <Figure This Out>');
				const response = wva.generate( lastMessages );
				onResponse( response );
				return;
			}
			
			// Process User Input
			console.log( 4 );
			const mode = await wva.storage.get( userID, '__mode__');
			
			// If User Input Is 'agent', ~connect to agent~ (display nonsense).
			console.log( 5 );
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
			console.log( 6 );
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
			// Save Input to Storage
			const nextStep = step + 1;
			await wva.storage.set( userID, store[step].name, message );
			if ( nextStep < store.length ) {
				await wva.storage.set( userID, '__step__', nextStep );
				const response = wva.generate([`Enter ${store[nextStep].label} >`]);
				onResponse( response );
				return;
			}
			// Complete Storing Data
			await wva.storage.clear( userID, '__mode__');
			await wva.storage.clear( userID, '__step__');
			await wva.storage.clear( userID, '__store__');
			const response = await wva.send( userID, 'success');
			onResponse( response );
		};
		
		const onResponse = async ( response )=> {
			// Handle Response
			console.log( 3 );
			const action = response.message.action;
			if ( action ) {
				// Perform Logic Based on Action
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
				// Change User Into Storing Mode
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
			// Send Response to User
			sendResponse( response );
		};
		
		const sendResponse = async ( response )=> {
			console.log( response );
			const message = response.message;
			const layout = message.layout;
			if ( layout ) {
				// Modify Response Message Based on Layouts Supported
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
			// Save the Last Response if Chat Was Reloaded.
			await wva.storage.set( userID, '__last__', message.text );
			res.status( 200 );
			res.json( response.message );
		};
		
		const actionGetProfile = ( userID )=> {
			// Logic for 'getUserProfileVariables'
			return User.find( userID )
				.then( userData => Promise.all([
					wva.storage.set( userID, 'bill_amount', userData['bill_amount']),
					wva.storage.set( userID, 'payment_due_date', userData['payment_due_date'])
				]))
				.then(()=> wva.send( userID, 'success'))
				.catch( err => wva.send( userID, 'failure'))
				.then( onResponse );
		};
		
		const actionPayBill = ( userID )=> {
			// Logic for 'payBill'
			return wva.storage
				.getKeys( userID, ['cc_number', 'cc_full_name', 'cc_exp_date', 'cc_code'])
				.then( ccData => Pay.send( userID, ccData ))
				.then( result => wva.storage.set( userID, 'balance', result.balance ))
				.then(()=> wva.send( userID, 'success'))
				.catch( err => wva.send( userID, 'failure'))
				.then( onResponse );
		};
		
		const actionGetLocation = ( userID )=> {
			// Logic for 'getLocation'
			return Geo.find( userID )
				.then( result => wva.storage.set( userID, 'location', result.coords ))
				.then(()=> wva.send( userID, 'success'))
				.catch( err => wva.send( userID, 'failure'))
				.then( onResponse );
		};
		
		const actionDefault = ( userID )=> {
			// Ignore Unhandled Actions.
			return wva.send( userID, 'success').then( onResponse );
		};
		
		// Start a New Chat, or Process Continuing Input
		console.log( 1 );
		if ( !chatID )
			startChat();
		else
			processInput();
	}
	catch ( err ) {
		// Something Broke.  Add Error Handling Here.
		console.error( err );
		if ( err )
			res.status( err.status ).send( err.message );
		else
			res.status( 500 ).send('Internal Server Error.');
	}
	finally {
		// Always Remove the Processing Flag from the User Storage
		await wva.storage.clear( userID, '__processing__');
	}
});

app.use(( req, res )=> {
	// Catch-All 404
	res.status( 404 );
	res.end();
});

server.listen( PORT, ()=> {
	console.log(`Server listening on port ${server.address().port}`);
});
