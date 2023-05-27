import { SlashCommandBuilder } from 'discord.js'
import error from './error/func'

export type DataBuilderOptions = {
    name: string
    aliases: string[]
    description: string
}
export type CommandBuilderOptions = {
    data: DataBuilder
    custom?: CustomDataBuilder
    code: Function
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
    code: Function
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
    public setCode(code: Function){
        this.code = code
        return this
    }
}