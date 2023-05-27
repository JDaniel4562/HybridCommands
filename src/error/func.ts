import json from './types.json';
import {name} from '../../package.json'

export type ErrorTypes = "notfound"|"routerr"|"login"|"slasherr"|"missargs"|"loaderr"|"slashediterr"|"cantdeleteslash"|"cantcreatecommand"

export default (type: ErrorTypes, exit:boolean = true) => {
    switch(exit){
        case true: {
            console.error(`[${name.toUpperCase} ERROR: ${type.toUpperCase()}] ${json[type]}`,0)
        }
        case false: {
            console.log(`[${name.toUpperCase} ERROR: ${type.toUpperCase()}] ${json[type]}`)
        }
    }
}