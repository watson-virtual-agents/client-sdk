
# Watson Virtual Agent - Client SDK

A JavaScript SDK for use with Watson Virtual Agents. Compatible with both server
and browser JavaScript environments.

## Getting started

This package can be used with NodeJS or a CommonJS / AMD compatible package
manager.  It may also be loaded in as a global script.

```console
npm install --save @watson-virtual-agent/client-sdk
```

*CommonJS*
```js
const SDK = require('@watson-virtual-agent/client-sdk');
// ...
```

*AMD*
```js
require(['@watson-virtual-agent/client-sdk'], SDK => {
	// ...
});
```

*Webpack*

If you are using Webpack to bundle your scripts, you need to include the
specific environment you need, `web` or `node`.

```js
const SDK = require('@watson-virtual-agent/client-sdk/lib/web');
```

## Quick Start

```js
const BOT_ID = 'YOUR_BOT_ID';
const textInput = document.getElementById('text-input');
const submitBtn = document.getElementById('submit-btn');

SDK.configure({
  XIBMClientID: 'YOUR-IBM-Client-ID',
  XIBMClientSecret: 'YOUR-IBM-Client-Secret'
});

SDK.start( BOT_ID )
  .then( response => {
    const chatID = res.chatID;
    const onRequest = message => {
      console.log('You:', message );
    };
    const onResponse = response => {
      response.message.text.forEach( text => {
        console.log('Agent:', text );
      });
    };
    onResponse( response );
    submitBtn.addEventListener('click', ()=> {
      const message = textInput.value;
      onRequest( message );
      SDK.send( BOT_ID, chatID, message )
      	.then( onResponse )
        .catch( err => console.error( err ));
    });
  })
  .catch( err => console.error( err ));
```

#### BotID

Now, click on 'Watson Virtual Agent'. This page demonstrates the api calls that
developers can use to interact with the bot. On the left sidebar, click 'Keys'
and select the default key. Scroll down and find the 'Retrieve Bot' call. For
the version parameter, enter '2016-09-16' then simply click 'Test' to retrieve
your botID. This should be a 32 digit alphanumeric code following the format of
'00000000-0000-0000-0000-000000000000'.

#### ClientID / ClientSecret

In order to retrieve the ClientID and ClientSecret, log into to the API
Manager at [https://developer.ibm.com/api/](https://developer.ibm.com/api/).
The first time you log into this site, you will be prompted to enter a username.
After clicking 'Next',  a linked titled 'My APIs' will appear in the top right.
Find the API called 'Watson Virtual Agent' and click on the key icon to the
right. A menu should expand below revealing your automatically generated API
key. These figures are hidden for security. Hover over the fields to find a
'SHOW' button. After clicking this button, the ClientID (top field) and
ClientSecret (bottom field) will both be visible. These values can now be
used to create and continue chats.

### Actions

Actions are included in the response when the SDK is expected to take an action.
Examples of actions include processing a credit card or updating an address. An
action is thrown as an event and expects *success*, *failure* or *cancel* as its
response.

```js
SDK.send( botID, chatID, message )
  .then( response => {
    if ( response.message.action ) {
      var action = response.message.action;
      switch( action.name ) {
      	case '<action-type>':
          // Do some action
          return SDK.send( botID, chatID, 'success');
        case '<action-type>':
          // Do some other action
          return SDK.send( botID, chatID, 'success');
      }
    }
  })
  .catch( err => console.error( err ));
```

### Layouts

The `layout` property of a response message is an optional hint the Virtual
Agent can provide about how to render a certain response. For example, a
`layout` value set to `"map"`, may indicate the response can be displayed with
latitude and longitude markers.  Or, a `layout` value of `"credit-card"` may
indicate additional client-side validation and security regarding payment
information.  A message with a `layout` will still always also include one or
more `text` messages that can be used if you do not have code to handle the
passed `layout` value.

`response.message.data` - Additional JSON data that can be used in the Layout

`response.message.store` - Definition of keys to be saved to profile. (ex.
storing form input)

```js
SDK.send( botID, chatID, message )
  .then( response => {
    if ( response.message.layout) {
      var layout = response.message.layout;
      switch( layout.name ) {
        case '<layout-type>':
          // Render special layout
          return;
        case '<layout-type>':
          // Render other special layout
          return;
      }
    }
  })
  .catch( err => console.error( err ));
```

### Managing Personally Identifiable Information (PII)

The Watson Virtual Agent system does not store any PII in the cloud (credit card
info, account balances, customer addresses, etc). However, the Agent can send
responses that include template tags to inject PII that exists on the client.
The SDK will inject values stored in `SDK.profile` into response templates.
Getting and setting the profile information is done using `SDK.profile` methods:

```js
SDK.profile.set('credit_card_number', 'xxxx-xxxx-xxxx-1234');
SDK.send( botID, chatID, message )
  .then( response => {
    // The server response was: `Use Card # |&credit_card_number|?`
    // The SDK has modified it to: `Use Card # xxxx-xxxx-xxxx-1234?`;
    const text = response.message.text[0];
  })
  .catch( err => console.error( err ));
```

Before a piece of profile information needs to be used by the Agent, an "action"
response should have been issued, instructing the client app to load the
appropriate data into the profile.

```js
getUserProfile( user => {
  SDK.send( botID, chatID, message )
    .then( response => {
      if ( response.message.action ) {
        var action = response.message.action;
        switch( action.name ) {
          case 'get-profile':
			action.args.variables.forEach( field => {
              SDK.profile.set( field, user[field] );
            });
            return SDK.send( botID, chatID, 'success');
          case '<action-type>':
            // Do some other action
            return SDK.send( botID, chatID, 'success');
        }
      }
    })
    .catch( err => console.error( err ));
});
```

For advanced documentation about using involving configuration and handling PII,
see [./docs/JSDOCS.md](./docs/JSDOCS.md).

The Watson Virtual Agent - Client SDK is related to the [Watson Virtual
Agent - Chat Widget](https://github.com/watson-virtual-agents/chat-widget)
(the Widget). The Widget is a browser-only chat component built on top of the
SDK, and it contains a configurable user interface and a set of utilities. You
can use it as-is, or you can customize it. Alternatively, if you want to have
ultimate control of your very own chat experience, use this SDK to build one.
