import { lstatSync, readdirSync } from 'fs'
import { join } from 'path'
var colors = require('colors')
import {Client, Collection} from 'discord.js'
import {CommandBuilder} from './CommandBuilder'
import error from './error/func'

export type SettingOptions = {
    path: string
    client: Client
    debug: boolean
    collection: Collection<string, CommandBuilder>
}

export class Settings {
    path: string
    client: Client
    debug: boolean
    collection: Collection<string, CommandBuilder>
    constructor(options: SettingOptions){
        this.path = options.path;
        this.client = options.client;
        this.debug = options.debug
        this.collection = options.collection
    }

    public async setCollection(path: string = this.path) {
        let mdir = process.cwd()
        let modules = readdirSync(join(mdir, path))
        for(const file of modules){
            let stat = lstatSync(join(mdir, path, file))
            if(stat.isDirectory()) {this.setCollection(join(path, file)); continue;}
            delete require.cache[require(join(mdir, path, file))]
            let command: CommandBuilder = require(join(mdir, path, file))
            if(!command.data.name) { this.debug?console.log('|-----------------------------------|\n' + `| ` + `Error Loading!` + `\n| File: ${join(path, file)}`):console.log(`Error loading: ${join(path, file)}`); continue};
            const slashes = await this.client.application!.commands.fetch().catch(() => null)
            this.collection.set(command.data.name,command)
            if (command.slash && !slashes!.find((x) => x.name === command.data.name)) {
                this.client.application!.commands.create({name: command.data.name,description: (command.data.description as string)})
            }
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