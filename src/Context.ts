import {ChatInputCommandInteraction, Message, GuildMember, Client,BaseGuildTextChannel,Guild, APIInteractionGuildMember, CommandInteractionOption} from 'discord.js'
import { urlToHttpOptions } from 'url'

export type ContextOptions = {
    message?: Message
    interaction?: ChatInputCommandInteraction
    type: 'normal' | 'slash'
}

export class Context {
    message: Message | undefined
    interaction: ChatInputCommandInteraction | undefined
    guild: Guild | undefined | null
    channel: BaseGuildTextChannel | undefined | null
    member: GuildMember | APIInteractionGuildMember | undefined | null
    client: Client | undefined
    type: 'normal' | 'slash'
    constructor(options: ContextOptions){
        switch(options.type==='normal'){
            case true: {
                this.message = options.message
                this.guild = options.message!.guild
                this.channel = (options.message!.channel as BaseGuildTextChannel)
                this.member = options.message!.member
                this.client = options.message!.client
                this.type = 'normal'
            } 
            case false: {
                this.interaction = options.interaction
                this.guild = options.interaction!.guild
                this.channel = (options.interaction!.channel as BaseGuildTextChannel)
                this.member = options.interaction!.member
                this.client = options.interaction!.client
                this.type = 'normal'
            }
        }
    }
    public get(search: string, required: boolean = false): CommandInteractionOption | null {
        return this.interaction!.options.get(search, required)
    }
    public addToContext(key: string, value: any): this {
        this[key] = value
        return this
    }
}