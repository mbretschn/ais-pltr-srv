import { default as express, Request, Response, Router } from 'express'
import { default as fetch } from 'node-fetch'
import { AISPLTRServer } from './index'
import { default as passport } from 'passport'
import { default as fileUpload } from 'express-fileupload'

export const ImageService = (server: AISPLTRServer): Router => {
    const router = Router()
    router.use(express.json())
    router.use(fileUpload())

    async function setImage(mmsi: number, name: string): Promise<any> {
        const regex = /(\d+px-)?(.*)/gm
        const matches = regex.exec(name)
        if (matches) {
            const file = matches[2]
            const head = {
                MMSI: mmsi
            }
            const tail = {
                URL: `https://commons.wikimedia.org/w/api.php?action=query&titles=Image:${encodeURIComponent(file)}&prop=imageinfo&iiprop=extmetadata&format=json`,
                IMAGE: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=320`
            }
            const res = await fetch(tail.URL)
            if (res.ok) {
                await server.database.db.collection('images').updateOne(head, { $set: tail, $setOnInsert: head }, { upsert: true })
                return { ...head, ...tail }
            }
        }
        return
    }

    router.post('/api/image', passport.authenticate('cognito', { session: false }), async (req: Request, res: Response) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.')
        }

        if (!Array.isArray(req.files.file)) {
            const data = await setImage(Number(req.body.mmsi), req.files.file.name)
            if (data) {
                return res.json(data)
            }
        }

        res.status(506).send('Not Acceptable')
    })


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