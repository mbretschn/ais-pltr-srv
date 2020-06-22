import { default as express, Request, Response, NextFunction, Router } from 'express'
import { AISPLTRServer, getFilter } from './index'
import { NmeaShipdataCollection } from 'ais-tools'

export const ShipService = (server: AISPLTRServer): Router => {
    const ships = new NmeaShipdataCollection(server.database, server.logger)

    const router = Router()
    router.use(express.json())

    router.get('/api/ships', async (req: Request, res: Response, next: NextFunction) => {
        const filter  = getFilter(req.query.filter)
        const limit   = Number(req.query.limit) || (Object.keys(filter).length < 1 ? 500 : 0)
        try {
            const data = await ships.fetch(filter, limit)
            res.json(data)
        } catch (err) {
            next(err)
        }
    })

    return router
}