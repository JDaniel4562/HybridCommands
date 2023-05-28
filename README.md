# About
This package has been created to help you in making a bot helping with the loaders of commands and introducing you in to the slashes!

# Installing the package
```
npm i hybridcommands
```
```
yarn add hybridcommands
```
# Config.json
```json
{
    "token": "DICORD_TOKEN",
    "clientId": "CLIENT_ID"
}
```
# Starting
```js
const { Settings, Context } = require('hybridcommands') //Calling all builders of the package
import { Client, Collection, REST, Routes } from 'discord.js' //Calling the class to build the discord bot and the collector
const { token, clientId } = require('path/of/your/config.json')

const client = new Client({
    intents: 32511 //Intents can be getted on discord's developers portal
}) //The client was been created

const settings = new Settings({
    path: './path/of/commands/', //The path to read the commands
    client: client, //The discord client of your bot
    clientId: clientId, //The id of your bot to add command slashes
    token: token, //The token of your bot
    debug: true, //Log when a command was readded succesfully, if you want no log that, set this parameter false
    collection: new Collection(), //Here is were the commands was be saved, is similar to a Map
    slashesBody: [],
    context: Context //You can make your customContext
})

client.on('ready', () => {
    console.log(`Logged as: ${client.user.tag}`)
});

settings.setCollection() //Loading the commands

const rest = new REST().setToken(settings.token);

(async () => {
	try {
		console.log(`Started refreshing ${settings.slashesBody.length} application (/) commands.`);

		// The put method is used to fully refresh all commands
		await rest.put(
			Routes.applicationCommands(settings.clientId),
			{ body: settings.slashesBody },
		);

		console.log(`Successfully reloaded application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})()

client.login(token)
```

# Command Example
```js
import {CommandBuilder, DataBuilder, CustomDataBuilder,ParamsBuilder} from 'hybridcommands'

const data = new DataBuilder({
    name: "ping",
    aliases: [],
    description: "pong!"
})
const customData = new CustomDataBuilder({
    foo: "bar"
})
const params = new ParamsBuilder({
    slash: data.adapt(),
    params: []
})
module.exports['command'] = new CommandBuilder({
    data: data,
    custom: customData,
    normal: true,
    slash: true,
    code: async(ctx) => {
        ctx.send("Pong!")
    }
})
```

# messageCreate Event
```js
client.on('messageCreate', async(message) => {
    if(message.author.bot || message.channel.type === 'dm') return; //If the messages is from a DM Channel the bot ignore that
    let prefix = '!' //The prefix of your bot
    const args = message.content.slice(prefix?.length).trim().split(/ +/);
    const commandName = args?.shift()?.toLowerCase();
    if (!commandName) return;
    const command = settings.getCommand(commandName)
    if(!command) return;
    const ctx = new Context({
        message: message,
        type: "normal"
    })

    try {
        command.code(ctx)
    } catch (e) {
        console.log
    }
})
```

# interactionCommand Event
```js
client.on('interactionCommand', async(interaction) => {
    if(interaction.isChatInputCommand){
        const command = settings.getCommand(interaction.commandName)
        if(!command) return;
        const ctx = new Context({
            interaction: interaction,
            type: "slash"
        })

        try {
            command.code(ctx)
        } catch (e) {
            console.log
        }
    }
})
```

# Index with Custom Context
Whereever you refer to the common Context you must change it to your CustomContext and export it from the index.
```js
const { Settings, Context } = require('hybridcommands')
import { Client, Collection, REST, Routes } from 'discord.js'
const { token, clientId } = require('path/of/your/config.json')

const client = new Client({
    intents: 32511 
})

class CustomContext extends Context {
    constructor(options){ //Make sure that what is contained in the options also has what the common Context needs
        super({
            data: options.data,
            command: options.command,
            type: options.type
        })
        //Do anything, this is a Class
    }
    //Also, you can made custom functions for your custom context!
}

const settings = new Settings({
    path: './path/of/commands/', 
    client: client, 
    clientId: clientId, 
    token: token, 
    debug: true, 
    collection: new Collection(), 
    slashesBody: [],
    context: CustomContext
})

client.on('ready', () => {
    console.log(`Logged as: ${client.user.tag}`)
});

settings.setCollection()

const rest = new REST().setToken(settings.token);

(async () => {
	try {
		console.log(`Started refreshing ${settings.slashesBody.length} application (/) commands.`);

		await rest.put(
			Routes.applicationCommands(settings.clientId),
			{ body: settings.slashesBody },
		);

		console.log(`Successfully reloaded application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})()

client.login(token)

module.exports['CustomContext'] = CustomContext //We export the CustomContext
```