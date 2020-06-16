import { default as express, Request, Response, Router, NextFunction } from 'express'
import { AISPLTRServer } from './index'
import { NmeaPositionCollection } from 'ais-tools'

export const HealthService = (server: AISPLTRServer): Router => {
    const router = Router()
    router.use(express.json())

    const positions = new NmeaPositionCollection(server.database, server.logger)

    router.get('/api/health', async (req: Request, res: Response, next: NextFunction) => {
        try {
            await positions.fetch({}, 1)
            res.json({ health: 'ok', status: 200 })
        } catch (err) {
            next(err)
        }
    })

    return router
}