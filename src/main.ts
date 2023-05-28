import { lstatSync, readdirSync } from 'fs'
import { join } from 'path'
import error from './error/func'
import { SlashCommandBuilder,ChatInputCommandInteraction, Message, GuildMember, Client,BaseGuildTextChannel,Guild, APIInteractionGuildMember, CommandInteractionOption,Collection,Embed,AttachmentBuilder,Attachment,BufferResolvable,ActionRowBuilder,ActionRow,AttachmentPayload, MessageEditOptions, REST, Routes, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js'
import {EmbedBuilder} from '@discordjs/builders'
import {APIEmbed,APIActionRowComponent} from 'discord-api-types/v10'

//Builder

export type DataBuilderOptions = {
    name: string
    aliases: string[]
    description: string
}
export type CommandBuilderOptions = {
    data: DataBuilder
    custom?: CustomDataBuilder
    code: (ctx: Context | Settings["customContext"]) => Promise<any>
    normal: boolean
    slash: boolean
}

export class DataBuilder {
    name: string | undefined
    aliases: string[] | undefined
    description: string | undefined
    constructor(options?:DataBuilderOptions){
        this.name = options?.name
        this.aliases = options?.aliases
        this.description = options?.description
    }
    public setName(input: string){
        this.name = input
        return this
    }
    public setDescription(input: string){
        this.description = input
        return this
    }
    public setAliases(input: string[]){
        this.aliases = input
        return this
    }
    public addAlias(input: string){
        this.aliases?.push(input)
        return this
    }
}

export class CustomDataBuilder {
    constructor(custom: object){
        (Object.entries(custom)).map((arg) => {
            this[arg[0]] = arg[1]
        })
    }
}

export class CommandBuilder {
    data: DataBuilder
    custom?: CustomDataBuilder
    code: (ctx: Context | Settings["customContext"]) => Promise<any>
    normal: boolean
    slash: boolean
    constructor(options: CommandBuilderOptions){
        this.data = options.data
        this.custom = options.custom
        this.normal = options.normal
        this.slash = options.slash
        this.code = options.code
    }
    public slashConv(){
        if(!this.data.name) return error('missargs')
        if(!this.data.description) return error('missargs')
        return new SlashCommandBuilder().setName(this.data.name).setDescription(this.data.description)
    }
    public setData(data: DataBuilder){
        this.data = data
        return this
    }
    public setCustom(custom: CustomDataBuilder){
        this.custom = custom
        return this
    }
    public allowNormal(){
        this.normal?false:true
        return this
    }
    public allowSlash(){
        this.slash?false:true
        return this
    }
    public setCode(code: (ctx: Context | Settings["customContext"]) => Promise<any>){
        this.code = code
        return this
    }
}

//Settings

export type SettingOptions = {
    path: string
    client: Client
    clientId: string
    token: string
    debug: boolean
    collection: Collection<string, CommandBuilder>
    slashesBody: RESTPostAPIChatInputApplicationCommandsJSONBody[]
    customContext?: any
}

export class Settings {
    path: string
    client: Client
    clientId: string
    token: string
    debug: boolean
    collection: Collection<string, CommandBuilder>
    slashesBody: RESTPostAPIChatInputApplicationCommandsJSONBody[]
    customContext?: any
    constructor(options: SettingOptions){
        this.path = options.path;
        this.client = options.client;
        this.clientId = options.clientId
        this.token = options.token
        this.debug = options.debug
        this.collection = options.collection
        this.slashesBody = options.slashesBody
        this.customContext = options.customContext
    }

    public async setCollection(path: string = this.path) {
        const rest = new REST().setToken(this.token);
        let mdir = process.cwd()
        let modules = readdirSync(join(mdir, path))
        for(const file of modules){
            let stat = lstatSync(join(mdir, path, file))
            if(stat.isDirectory()) {this.setCollection(join(path, file)); continue;}
            delete require.cache[require(join(mdir, path, file))]
            let command: CommandBuilder = require(join(mdir, path, file)).command
            if(!command!.data!.name) { this.debug?console.log('|-----------------------------------|\n' + `| ` + `Error Loading!` + `\n| File: ${join(path, file)}`):console.log(`Error loading: ${join(path, file)}`); continue};
            this.collection.set(command.data.name,command)
            this.slashesBody.push((command.slashConv() as SlashCommandBuilder).toJSON())
            /**
            if (command.slash && !slashes!.find((x) => x.name === command.data.name)) {
                this.client.application!.commands.create({name: command.data.name,description: (command.data.description as string)})
            }
            const slashes = await this.client.application!.commands.fetch().catch(() => null)
             */
            this.debug?console.log('|-----------------------------------|\n' + `| ` + `Command Loaded!` + `\n| Name: ${command.data.name} \n| From: ${join(path, file)}`):null
        }
        this.debug?console.log('|-----------------------------------|'):null
        return this
    }

    async deleteCommand(name) {
        try {
            await this.client.application!.commands.fetch()
            let x = this.client.application!.commands.cache.find((x) => x.name === name)
            return x!.delete()
        }catch(e) {
            error("cantdeleteslash")
        }
    }

    getCommand(search: string): CommandBuilder | undefined {
        return this.collection.get(search) || this.collection.find(c => c.data.aliases?.includes(search))
    }

    setCommand(command: CommandBuilder): CommandBuilder | void {
        if(!command.data.name) return error('cantcreatecommand', false)
        this.collection.set((command.data.name as string), command)
        return command
    }
}

//Context

export type ContextOptions = {
    data: Message<boolean> | ChatInputCommandInteraction | undefined
    command: CommandBuilder
    type: 'normal' | 'slash'
}

export type sendOptions = {
    content?: string
    embeds?: (EmbedBuilder|Embed|APIEmbed)[]
    files?: (AttachmentBuilder|Attachment|AttachmentPayload|BufferResolvable)[]
    components?: (ActionRowBuilder|ActionRow<any>|APIActionRowComponent<any>)[]
    ephemeral?: boolean
    fetchReply?: boolean
    reply?: boolean
}

export type editOptions = {
    content?: string
    embeds?: (EmbedBuilder|Embed|APIEmbed)[]
    files?: (AttachmentBuilder|Attachment|AttachmentPayload|BufferResolvable)[]
    components?: (ActionRowBuilder|ActionRow<any>|APIActionRowComponent<any>)[]
    attachments?: (AttachmentPayload)[]
}

export class Context {
    data: Message<boolean> | ChatInputCommandInteraction | undefined
    guild: Guild | undefined | null
    channel: BaseGuildTextChannel | undefined | null
    member: GuildMember | APIInteractionGuildMember | undefined | null
    client: Client | undefined
    command: CommandBuilder
    type: 'normal' | 'slash' | 'unknown'
    constructor(options: ContextOptions){
        let d = options.data
        this.data = d
        this.guild = d!.guild
        this.channel = (d!.channel as BaseGuildTextChannel)
        this.member = d!.member
        this.client = d!.client
        this.command = options.command
        this.type = options.type
    }
    public get(search: string, dafultValue?: any, required: boolean = false): CommandInteractionOption | any {
        return (this.data as ChatInputCommandInteraction).options.get(search, required) || dafultValue
    }
    public addToContext(key: string, value: any): this {
        this[key] = value
        return this
    }
    public async send(options: sendOptions | string){
        switch(this.type){
            case "normal": {
                let op;
                typeof options === 'string'?op = {
                    content: options,
                    embeds: [],
                    files: [],
                    components: []
                } : op = {
                    content: options.content,
                    embeds: options.embeds,
                    files: options.files,
                    components: options.components
                }
                return typeof options === 'string'?(this.data as Message<boolean>).channel!.send(op):options.reply?(this.data as Message<boolean>).reply(op):(this.data as Message<boolean>).channel!.send(op)
            }
            case "slash": {
                let op;
                typeof options === 'string'?op = {
                    content: options,
                    embeds: [],
                    files: [],
                    components: [],
                    ephemeral: false,
                    fetchReply: false
                } : op = {
                    content: options.content,
                    embeds: options.embeds,
                    files: options.files,
                    components: options.components,
                    ephemeral: options.ephemeral,
                    fetchReply: options.fetchReply
                } 
                return (this.data as ChatInputCommandInteraction).reply(op)
            }
            default: return error("notfound",false)
        }
    }
    public async edit(message: Message<boolean>, options: editOptions | string){
        return await message.edit((options as MessageEditOptions))
    }
}