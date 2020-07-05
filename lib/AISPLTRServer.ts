import { default as express, Request, Response, NextFunction } from 'express'
import { MessageLogger } from 'ais-tools'
import { Server } from 'http'
import { Subscriptions, ImageService, ShipService, PositionService, SocketService, HealthService, SSHTunnel, AuthService, AuthServiceError, AuthServiceClass } from './index'
import { EventEmitter } from 'events'
import { default as passport } from 'passport'
import { Strategy } from 'passport-custom'

export class AISPLTRServer extends EventEmitter {
    public config: any

    public app: express.Express
    public http: Server
    public logger: MessageLogger
    public database: Subscriptions
    public auth: AuthServiceClass

    private tunnel: SSHTunnel
    private exiting: boolean = false
    private connected: boolean = false

    constructor(config: any) {
        super()

        this.config = config

        this.app = express()
        this.http = new Server(this.app)

        this.logger = new MessageLogger(this.config.logger)
        this.tunnel = new SSHTunnel(this.config.ssh, this.logger)
        this.database = new Subscriptions(this.config.database, this.logger)
        this.auth = new AuthServiceClass(this.config.cognito, this.logger)

        passport.use('cognito', new Strategy(async (req: Request, done: Function) => {
            const authorization = (req.get('Authorization') as String).substr(7)
            try {
                const result = await this.auth.Verify(authorization)
                done(null, result)
            } catch (ex) {
                done(ex)
            }
        }))
    }

    private async teardown(): Promise<void> {
        if (this.exiting) return
        this.exiting = true

        this.logger.info(`Teardown AISPLTRServer(${process.pid})`)

        if (this.connected) {
            await this.database.close()
            this.logger.info(`Database disconnected`)
        }

        await this.tunnel.stop()
        this.logger.info(`Exit AISPLTRServer(${process.pid})`)

        this.emit('exit')
    }

    public stop = async (): Promise<void> => {
        if (this.exiting) return

        this.logger.warn('AISPLTRServer Signal caught, exiting!')
        await this.teardown()
    }

    public async start(): Promise<void> {
        this.logger.info(`Start AISPLTRServer(${process.pid})`)

        try {
            this.tunnel.start()
            await this.database.connect()

            this.app.use(passport.initialize())
            this.app.use(AuthService(this))
            this.app.use(HealthService(this))
            this.app.use(ImageService(this))
            this.app.use(ShipService(this))
            this.app.use(PositionService(this))

            this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
                if (err instanceof AuthServiceError) {
                    res.status(401).send(err.message)
                } else {
                    this.logger.error('DatabaseError', err)
                    res.status(500).json({ error: 'DatabaseError', status: 500 })
                    this.teardown()
                }
            })

            AuthService(this)
            SocketService(this)

            await this.database.run()

            this.http.listen(this.config.http.port, () => {
                this.logger.info('Server started', {
                    host: 'http://localhost:' + this.config.http.port,
                    loglevel: this.logger.level
                })
            })
        } catch (err) {
            this.logger.error('ServerError', err)
            this.teardown()
        }
    }
}