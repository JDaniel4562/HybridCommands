import { lstatSync, readdirSync } from 'fs'
import { join } from 'path'
import error from './error/func'
import { SlashCommandBuilder,ChatInputCommandInteraction, Message, GuildMember, Client,BaseGuildTextChannel,Guild, APIInteractionGuildMember, CommandInteractionOption,Collection,Embed,AttachmentBuilder,Attachment,BufferResolvable,ActionRowBuilder,ActionRow,AttachmentPayload, MessageEditOptions, REST, Routes, RESTPostAPIChatInputApplicationCommandsJSONBody,SlashCommandAttachmentOption,SlashCommandBooleanOption,SlashCommandChannelOption,SlashCommandIntegerOption,SlashCommandMentionableOption,SlashCommandUserOption,SlashCommandNumberOption,SlashCommandRoleOption,SlashCommandStringOption } from 'discord.js'
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
    params?: ParamsBuilder
    code: (ctx: Context | Settings["context"]) => Promise<any>
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
    public adapt(){
        return new SlashCommandBuilder().setName((this.name as string)).setDescription((this.description as string))
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
    params?: ParamsBuilder
    code: (ctx: Context | Settings["context"]) => Promise<any>
    normal: boolean
    slash: boolean
    constructor(options: CommandBuilderOptions){
        this.data = options.data
        this.custom = options.custom || {}
        this.params = options.params || undefined
        this.normal = options.normal
        this.slash = options.slash
        this.code = options.code
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
    public setCode(code: (ctx: Context | Settings["context"]) => Promise<any>){
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
    context?: any
}

export class Settings {
    path: string
    client: Client
    clientId: string
    token: string
    debug: boolean
    collection: Collection<string, CommandBuilder>
    slashesBody: RESTPostAPIChatInputApplicationCommandsJSONBody[]
    context?: any
    constructor(options: SettingOptions){
        this.path = options.path;
        this.client = options.client;
        this.clientId = options.clientId
        this.token = options.token
        this.debug = options.debug
        this.collection = options.collection
        this.slashesBody = options.slashesBody
        this.context = options.context
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
            let toPush = command.params || command.data
            this.slashesBody.push((toPush.adapt() as SlashCommandBuilder).toJSON())
            this.debug?console.log('|-----------------------------------|\n' + `| ` + `Command Loaded!` + `\n| Name: ${command.data.name} \n| From: ${join(path, file)}`):null
        }
        this.debug?console.log('|-----------------------------------|'):null
        return this
    }

    async deleteCommand(name) {
        try {
            await this.client.application!.commands.fetch()
            let x = this.client.application!.commands.cache.find((x) => x.name === name)
            this.collection.delete(name)
            return x!.delete()
        }catch(e) {
            error("cantdeleteslash")
        }
    }

    public getCommand(search: string): CommandBuilder | undefined {
        return this.collection.get(search) || this.collection.find(c => c.data.aliases?.includes(search))
    }

    public async setCommand(command: CommandBuilder): Promise<CommandBuilder | void> {
        if(!command.data.name) return error('cantcreatecommand', false)
        const commands = await this.client.application!.commands.fetch()
        let toPush = command.params || command.data
        if (!commands.find((x) => x.name === (toPush.adapt() as SlashCommandBuilder).toJSON().name)) {
            this.client.application!.commands.create((toPush.adapt() as SlashCommandBuilder).toJSON())
        }
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

//Params Builder
export type ParamsBuilderOptions = {
    slash: SlashCommandBuilder
    params: ParamObject[]
}

export type ParamObject = {name:string,description:string,required:boolean,type:ParamsTypes}

export type ParamsTypes = 'attachment'|'boolean'|'channel'|'integer'|'mention'|'user'|'number'|'role'|'string'

export class ParamsBuilder {
    slash: SlashCommandBuilder
    params: ParamObject[]
    constructor (options: ParamsBuilderOptions){
        this.slash = options.slash
        this.params = options.params
    }
    
    public adapt(){
        if(!this.slash.name) return error('missargs')
        if(!this.slash.description) return error('missargs')
        let res = new SlashCommandBuilder().setName(this.slash.name).setDescription(this.slash.description)
        for (const param of this.params){
            switch(param.type){
                case 'attachment': {
                    let input = new SlashCommandAttachmentOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addAttachmentOption(input)
                }
                case 'boolean': {
                    let input = new SlashCommandBooleanOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addBooleanOption(input)
                }
                case 'channel': {
                    let input = new SlashCommandChannelOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addChannelOption(input)
                }
                case 'integer': {
                    let input = new SlashCommandIntegerOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addIntegerOption(input)
                }
                case 'mention': {
                    let input = new SlashCommandMentionableOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addMentionableOption(input)
                }
                case 'user': {
                    let input = new SlashCommandUserOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addUserOption(input)
                }
                case 'number': {
                    let input = new SlashCommandNumberOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addNumberOption(input)
                }
                case 'role': {
                    let input = new SlashCommandRoleOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addRoleOption(input)
                }
                case 'string': {
                    let input = new SlashCommandStringOption().setName(param.name).setDescription(param.description).setRequired(param.required)
                    res.addStringOption(input)
                }
            }
        }
        return res
    }

    public addParam(name: string, description: string, required: boolean, type: ParamsTypes){
        let obj: ParamObject = {
            name,
            description,
            required,
            type
        }
        this.params.push(obj)
        return this
    }
}