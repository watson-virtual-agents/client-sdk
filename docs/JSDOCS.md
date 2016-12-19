<a name="SDK"></a>

## SDK : <code>object</code>
**Kind**: global namespace  

* [SDK](#SDK) : <code>object</code>
    * [.profile](#SDK.profile) : <code>object</code>
        * [.get(key)](#SDK.profile.get) ⇒ <code>Any</code>
        * [.set(key, value)](#SDK.profile.set) ⇒ <code>Object</code>
        * [.has(key)](#SDK.profile.has) ⇒ <code>Boolean</code>
        * [.clear()](#SDK.profile.clear) ⇒ <code>Object</code>
        * [.delete(key)](#SDK.profile.delete) ⇒ <code>Object</code>
        * [.forEach(callback, this)](#SDK.profile.forEach) ⇒ <code>Object</code>
    * [.configure(config)](#SDK.configure) ⇒ <code>[SDK](#SDK)</code>
    * [.start(botID)](#SDK.start) ⇒ <code>Promise({ chatID: &quot;string&quot;, message: &quot;string&quot; })</code>
    * [.send(botID, chatID, message)](#SDK.send) ⇒ <code>Promise({ message: &quot;string&quot; })</code>
    * [.parse(message)](#SDK.parse) ⇒ <code>Any</code>

<a name="SDK.profile"></a>

### SDK.profile : <code>object</code>
**Kind**: static namespace of <code>[SDK](#SDK)</code>  

* [.profile](#SDK.profile) : <code>object</code>
    * [.get(key)](#SDK.profile.get) ⇒ <code>Any</code>
    * [.set(key, value)](#SDK.profile.set) ⇒ <code>Object</code>
    * [.has(key)](#SDK.profile.has) ⇒ <code>Boolean</code>
    * [.clear()](#SDK.profile.clear) ⇒ <code>Object</code>
    * [.delete(key)](#SDK.profile.delete) ⇒ <code>Object</code>
    * [.forEach(callback, this)](#SDK.profile.forEach) ⇒ <code>Object</code>

<a name="SDK.profile.get"></a>

#### profile.get(key) ⇒ <code>Any</code>
Get an item from the user profile based on key.

**Kind**: static method of <code>[profile](#SDK.profile)</code>  
**Returns**: <code>Any</code> - Returns: the value of the key in the profile map.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The named key of the value you are accessing. |

**Example**  
```js
SDK.profile.get('first_name');
```
<a name="SDK.profile.set"></a>

#### profile.set(key, value) ⇒ <code>Object</code>
Set an item from the user profile based on key.

**Kind**: static method of <code>[profile](#SDK.profile)</code>  
**Returns**: <code>Object</code> - Returns: An instance of SDK.profile for chaining.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The named key of the value you are setting. |
| value | <code>string</code> | The value you are setting. |

**Example**  
```js
SDK.profile.set('first_name', 'john');
```
<a name="SDK.profile.has"></a>

#### profile.has(key) ⇒ <code>Boolean</code>
See if an item from the user profile exists based on key.

**Kind**: static method of <code>[profile](#SDK.profile)</code>  
**Returns**: <code>Boolean</code> - Returns: Boolean indicating if the key exists.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The named key of the value you are checking the existance of. |

**Example**  
```js
SDK.profile.has('first_name');
```
<a name="SDK.profile.clear"></a>

#### profile.clear() ⇒ <code>Object</code>
Clear the entire user profile.

**Kind**: static method of <code>[profile](#SDK.profile)</code>  
**Returns**: <code>Object</code> - Returns: An instance of SDK.profile for chaining.  
**Example**  
```js
SDK.profile.clear();
```
<a name="SDK.profile.delete"></a>

#### profile.delete(key) ⇒ <code>Object</code>
Delete an item from the user profile based on key.

**Kind**: static method of <code>[profile](#SDK.profile)</code>  
**Returns**: <code>Object</code> - Returns: An instance of SDK.profile for chaining.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The named key of the value you are deleting. |

**Example**  
```js
SDK.profile.delete('first_name');
```
<a name="SDK.profile.forEach"></a>

#### profile.forEach(callback, this) ⇒ <code>Object</code>
Iterate over the profile.

**Kind**: static method of <code>[profile](#SDK.profile)</code>  
**Returns**: <code>Object</code> - Returns: An instance of SDK.profile for chaining.  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The function you are calling on each item in the profile object. This function is passed key as the first argument and value as the second argument. |
| this | <code>Object</code> | (optional) The context you wish to call the callback in. |

**Example**  
```js
SDK.profile.forEach(function(key, value) {
  console.log(key, value);
});
```
<a name="SDK.configure"></a>

### SDK.configure(config) ⇒ <code>[SDK](#SDK)</code>
Configure the Client SDK

**Kind**: static method of <code>[SDK](#SDK)</code>  
**Returns**: <code>[SDK](#SDK)</code> - Returns: The SDK singleton  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| config | <code>Object</code> |  |  |
| config.baseURL | <code>string</code> | <code>&quot;https://dev.api.ibm.com/virtualagent/development/api/v1/&quot;</code> | Optional: The URL the SDK should prepend to requests. |
| config.timeout | <code>int</code> | <code>30000</code> | Optional: How long requests should wait before they error. |
| config.userID | <code>string</code> |  | Optional: A user identifier, transformed by a one-way hashing algorithm. |
| config.withCredentials | <code>string</code> |  | Optional: indicates whether or not cross-site Access-Control requests should be made using credentials |
| config.XIBMClientID | <code>string</code> |  | Optional: Your X-IBM-Client-Id. This should not be made public in a public environment. Including this will add X-IBM-Client-Id as a header to your request. |
| config.XIBMClientSecret | <code>string</code> |  | Optional: Your X-IBM-Client-Secret. This should not be made public in a public environment. Including this will add X-IBM-Client-Secret as a header to your request. |

**Example**  
```js
SDK.configure({
  baseURL: 'https://server.mysite.com'
});
```
<a name="SDK.start"></a>

### SDK.start(botID) ⇒ <code>Promise({ chatID: &quot;string&quot;, message: &quot;string&quot; })</code>
Start a new chat session

**Kind**: static method of <code>[SDK](#SDK)</code>  
**Returns**: <code>Promise({ chatID: &quot;string&quot;, message: &quot;string&quot; })</code> - Returns: A Promise that resolves when the chat session is started.  

| Param | Type | Description |
| --- | --- | --- |
| botID | <code>string</code> | Your botID. |

**Example**  
```js
SDK.start(botID)
   .then(function(res) {
     console.log(res.chatID, res.message);
   })
   .catch(function(err) {
     console.error(err);
   });
```
<a name="SDK.send"></a>

### SDK.send(botID, chatID, message) ⇒ <code>Promise({ message: &quot;string&quot; })</code>
Send a message to a chat session

**Kind**: static method of <code>[SDK](#SDK)</code>  
**Returns**: <code>Promise({ message: &quot;string&quot; })</code> - Returns: A Promise that resolves when the bot responds.  

| Param | Type | Description |
| --- | --- | --- |
| botID | <code>string</code> | Your botID |
| chatID | <code>string</code> | Your chatID provided by SDK.start |
| message | <code>string</code> | Your message |

**Example**  
```js
SDK.send(botID, chatID, 'Hello!')
   .then(function(data) {
     console.log(data.message);
   })
   .catch(function(err) {
     console.error(err);
   });
```
<a name="SDK.parse"></a>

### SDK.parse(message) ⇒ <code>Any</code>
Iterate profile data into a given message object.

**Kind**: static method of <code>[SDK](#SDK)</code>  
**Returns**: <code>Any</code> - Returns: The message in original format with variables replaced.  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>Any</code> | A string or message object to insert profile data into. |

**Example**  
```js
var message = "You owe |&bill_amount|.";
var parsed = SDK.parse(message);
```
