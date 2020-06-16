import { config } from 'node-config-ts'
import { AISPLTRServer } from './lib'

const main = async function () {
    process.stdin.resume()

    const server = new AISPLTRServer(config)

    server.on('exit', () => process.exit())

    process.on('SIGUSR1', server.stop)
    process.on('SIGUSR2', server.stop)
    process.on('SIGINT', server.stop)

    await server.start()
}

main()
