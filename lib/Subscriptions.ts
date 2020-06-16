import { v4String } from 'uuid/interfaces'
import { Socket } from 'socket.io'
import { MessageLogger, IDbConfig, IDatabase, Database, NmeaShipdataCollection, NmeaPositionCollection, NmeaPosition, NmeaShipdata } from 'ais-tools'

export interface ISubscriptionMessage {
    uuid: v4String
}

export interface ISubscription {
    subscription: ISubscriptionMessage
    socket: Socket
}

export class Subscriptions extends Database implements IDatabase {
    private subscriptions: ISubscription[] = []
    private logger: MessageLogger

    private ships: NmeaShipdataCollection
    private positions: NmeaPositionCollection

    private messages: any

    public constructor(config: IDbConfig, logger: MessageLogger) {
        super(config)

        this.logger = logger
        this.ships = new NmeaShipdataCollection(this, logger)
        this.positions = new NmeaPositionCollection(this, logger)
    }

    public async close(): Promise<undefined> {
        await super.close()

        for (const subscription of this.subscriptions) {
            subscription.socket.emit('before:disconnect')
        }

        return
    }

    public subscribe(subscription: ISubscriptionMessage, socket: Socket): void {
        let idx = this.subscriptions.findIndex(item => item.subscription.uuid === subscription.uuid)
        if (idx >= 0) {
            const subscriber: ISubscription = this.subscriptions[idx]

            this.logger.info('Subscription updated', subscriber.subscription)
        } else {
            const subscriber: ISubscription = {
                subscription: subscription,
                socket: socket
            }

            this.logger.info('Subscription created', subscriber.subscription)
            this.subscriptions.push(subscriber)
        }
    }

    public unsubscribe(subscription: ISubscriptionMessage): void {
        let idx = this.subscriptions.findIndex(item => item.subscription.uuid === subscription.uuid)
        if (idx >= 0) {
            const subscribers = this.subscriptions.splice(idx, 1)
            const subscriber = subscribers[0]
            subscriber.socket.disconnect(true)
            this.logger.info('Subscription ended', subscriber.subscription)
        }
    }

    private async emitPosition(subscriber: ISubscription, position: NmeaPosition) {
        subscriber.socket.emit('positions', position.toJSON())
    }

    private async emitShipdata(subscriber: ISubscription, shipdata: NmeaShipdata) {
        subscriber.socket.emit('ships', shipdata.toJSON())
    }

    private onData = async (data: any): Promise<void> => {
        if (data.Type === 'NmeaPosition') {
            const position = new NmeaPosition(this.positions, data.Data)

            this.logger.debug('Position', position.toInfo())

            for (const subscriber of this.subscriptions) {
                this.emitPosition(subscriber, position)
            }
        }

        if (data.Type === 'NmeaShipdata') {
            const shipdata = new NmeaShipdata(this.ships, data.Data)

            this.logger.debug('Shipdata', shipdata.toInfo())

            for (const subscriber of this.subscriptions) {
                this.emitShipdata(subscriber, shipdata)
            }
        }
    }

    private onEnd = async (data: any): Promise<void> => {
        this.logger.debug('end', data)
        this.messages.off('data', this.onData)
        this.messages.off('end', this.onEnd)
        this.messages.off('close', this.onClose)

        await this.run()
    }

    private onClose = (data: any): void => {
        this.logger.debug('close')
    }

    public async run(): Promise<void> {
        try {
            this.logger.debug('open')
            this.messages = this.tail('messages', { TimeStamp: { $gte: Date.now() } })
            this.logger.debug('start')

            this.messages.on('data', this.onData)
            this.messages.on('end', this.onEnd)
            this.messages.on('close', this.onClose)
        } catch (ex) {
            this.logger.error('tail', ex)
            await this.onEnd(ex)
        }
    }

    public async connect(): Promise<undefined> {
        await super.connect()

        const collections = await this.db.listCollections().toArray()

        if (!collections.find((collection: any) => collection.name === 'images')) {
            await this.db.createCollection('images')
        }

        return
    }
}
