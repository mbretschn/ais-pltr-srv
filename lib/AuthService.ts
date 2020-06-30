import { default as express, Request, Response, NextFunction } from 'express'
import { AISPLTRServer } from './index'

import { default as fetch } from 'node-fetch'
(global as any).fetch = fetch

import { default as passport } from 'passport'
import { default as CognitoStrategy } from 'passport-cognito'

export const AuthService = (server: AISPLTRServer): any => {
    passport.use(new CognitoStrategy(server.config.cognito,
        (accessToken, idToken, refreshToken, user, cb) => {
            console.log(accessToken, idToken, refreshToken, user)
            process.nextTick(function () {
                cb(null, user)
            })
        }
    ))

    server.app.post('/auth', passport.authenticate('cognito'), (req: Request, res: Response, next: NextFunction) => {
        console.log('?')
    })
}
