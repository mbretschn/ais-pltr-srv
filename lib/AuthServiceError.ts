export class AuthServiceError extends Error {
    orig: any
    constructor (message: string) {
        super(message)

        this.name = this.constructor.name

        Error.captureStackTrace(this, this.constructor)
    }
}
