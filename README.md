# About
This package has been created to help you in making a bot helping with the loaders of commands and introducing you in to the slashes!

# Installing the package
```
npm i hybridcommands
```
```
yarn add hybridcommands
```

# Starting
```js
const {Settings,CommandBuilder,Context, DataBuilder, CustomDataBuilder} = require('hybridcommands') //Calling all builders of the package
const {Client, Collection} = require('discord.js') //Calling the class to build the discord bot and the collector

const client = new Client({
    intents: 32511 //Intents can be getted on discord's developers portal
}) //The client was been created

const settings = new Settings({
    path: './the/path/of/commands.js', //If all of your code it's inside of a folder add the folder, like this: ./src/commands/
    client: client //Here must be the client of your bot to can add and create slashes
    debug: true //Log when a command was readded succesfully, if you want no log that, set this parameter false
    collection: new Collection() //Here is were the commands was saved, is similar to a Map
})

client.on('ready', () => {
    console.log('Bot Inicializado')
});

settings.setCollection() //Loading the commands
```

# Command Example
```js
const {CommandBuilder, DataBuilder, CustomDataBuilder} = require('hybridcommands')

const data = new DataBuilder({
    name: "ping",
    aliases: [],
    description: "pong!"
})
const customData = new CustomDataBuilder({
    foo: "bar"
})

module.exports = new CommandBuilder({
    data: data,
    custom: customData,
    normal: true,
    slash: true,
    code: async(ctx) => {
        ctx.type === "normal"?message.reply("Pong!"):interaction.reply("Pong!")
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