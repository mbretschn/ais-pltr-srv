import { default as express, Request, Response, Router } from 'express'
import { default as fetch } from 'node-fetch'
import { AISPLTRServer } from './index'

export const ImageService = (server: AISPLTRServer): Router => {
    const router = Router()
    router.use(express.json())

    async function getImage(mmsi: number): Promise<any> {
        const result = await server.database.db.collection('images').find({ MMSI: mmsi }).limit(1).toArray()
        const image = result[0]
        if (image) {
            const res = await fetch(image.URL)
            if (res.ok) {
                const json = await res.json()
                json.url = image.IMAGE
                return json
            }
        }
        return
    }

    router.get('/api/image/:mmsi', async (req: Request, res: Response) => {
        const data = await getImage(Number(req.params.mmsi))
        if (data) {
            return res.json(data)
        }
        res.status(204).send()
    })

    return router
}