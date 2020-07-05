import { default as express, Request, Response, Router } from 'express'
import { AISPLTRServer } from './index'

export const AuthService = (server: AISPLTRServer): Router => {
    const router = Router()
    router.use(express.json())

    router.post('/auth/login', async (req: Request, res: Response) => {
        try {
            const tokens = await server.auth.Login(req.body) as any
            res.json(Object.assign(tokens, await server.auth.Verify(tokens.access)))
        } catch (ex) {
            server.logger.warn('Auth Error', req.headers['x-forwarded-for'] || req.connection.remoteAddress)
            res.status(401).send(ex.message)
        }
    })

    router.post('/auth/refresh', async (req: Request, res: Response) => {
        try {
            const tokens = await server.auth.Refresh(req.body.Username, req.body.Token) as any
            res.json(Object.assign(tokens, await server.auth.Verify(tokens.access)))
        } catch (ex) {
            server.logger.warn('Auth Error', req.headers['x-forwarded-for'] || req.connection.remoteAddress)
            res.status(401).send(ex.message)
        }
    })

    router.post('/auth/verify', async (req: Request, res: Response) => {
        try {
            res.json(await server.auth.Verify(req.body.Token))
        } catch (ex) {
            server.logger.warn('Auth Error', req.headers['x-forwarded-for'] || req.connection.remoteAddress)
            res.status(401).send(ex.message)
        }
    })

    return router
}
