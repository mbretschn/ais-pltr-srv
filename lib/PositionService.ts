import { default as express, Request, Response, NextFunction, Router } from 'express'
import { AISPLTRServer, getFilter, getOptions } from './index'
import { NmeaPositionCollection } from 'ais-tools'

export const PositionService = (server: AISPLTRServer): Router => {
    const positions = new NmeaPositionCollection(server.database, server.logger)

    const router = Router()
    router.use(express.json())

    router.get('/api/positions', async (req: Request, res: Response, next: NextFunction) => {
        const filter  = getFilter(req.query.filter)
        const options = getOptions(req.query.options)
        const limit   = Number(req.query.limit) || (Object.keys(filter).length < 1 ? 500 : 0)
        try {
            const data = await positions.fetch(filter, limit, options)
            res.json(data)
        } catch (err) {
            next(err)
        }
    })

    router.get('/api/position', async (req: Request, res: Response, next: NextFunction) => {
        const filter  = getFilter(req.query.filter)
        try {
            const data = await positions.find(filter)
            res.json(data)
        } catch (err) {
            next(err)
        }
    })

    return router
}