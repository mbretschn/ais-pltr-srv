import { default as moment } from 'moment'

export const getFilter = function (raw: any): any {
    if (raw) {
        const filter = JSON.parse(raw as string)
        if (filter.TimeStamp) {
            let keys = Object.keys(filter.TimeStamp)
            for (let i = 0; i < keys.length; i++) {
                filter.TimeStamp[keys[i]] = moment.utc(filter.TimeStamp[keys[i]]).toDate()
            }
        }
        return filter
    } else {
        return {}
    }
}

export const getOptions = function (raw: any): any {
    if (raw) {
        return JSON.parse(raw)
    } else {
        return {}
    }
}