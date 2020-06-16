import { default as express, Request, Response, NextFunction, Router } from 'express'
import { AISPLTRServer, getFilter } from './index'
import { NmeaShipdataCollection } from 'ais-tools'

export const ShipService = (server: AISPLTRServer): Router => {
    const ships = new NmeaShipdataCollection(server.database, server.logger)

    const router = Router()
    router.use(express.json())

    router.get('/api/ships', async (req: Request, res: Response, next: NextFunction) => {
        const filter  = getFilter(req.query.filter)
        const limit   = Number(req.query.limit) || 0
        try {
            const data = await ships.fetch(filter, limit)
            res.json(data)
        } catch (err) {
            next(err)
        }
    })

    router.get('/api/ship', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await ships.find(getFilter(req.query.filter))
            res.json(data)
        } catch (err) {
            next(err)
        }
    })

    return router
}