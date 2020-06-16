import { default as SocketServer, Socket } from 'socket.io'
import { AISPLTRServer, ISubscriptionMessage } from './index'

export const SocketService = (server: AISPLTRServer): any => {
    const io = SocketServer(server.http)

    io.on('connection', (socket: Socket) => {
        socket.on('subscribe', (subscription: ISubscriptionMessage) => {
            server.database.subscribe(subscription, socket)
        })
        socket.on('unsubscribe', (subscription: ISubscriptionMessage) => {
            server.database.unsubscribe(subscription)
        })
    })
}