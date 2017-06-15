
## Server Example

An example of using the Watson Virtual Agent Client SDK to build a server
that provides requests and responses for a simple, text-only interface.

### Environment

`DEBUG` - (Default: `false`) Set to true if you want additional console output.
`PORT` - (Default: `1337`) Set to the port you wish to bind to.
`BASE_URL` - (Default: `https://api.ibm.com/virtualagent/run/api/v1`) Set to the WVA API you wish to point to (_development use only_)
`WVA_AGENT_ID` - Set to the Agent ID (Bot ID) of your Agent.
`WVA_CLIENT_ID` - Set to the Client ID from your API Key.
`WVA_CLIENT_SECRET` - Set to the Client Secret from your API Key.

### Running

```
cd examples/server
node app
```

### Usage

Type a "username" to use for your conversation.  This can be anything, but would
normally be based on some sort of login system.

Send messages back and forth with your Agent.  Reloading the page will retrieve
the last message sent to you.
