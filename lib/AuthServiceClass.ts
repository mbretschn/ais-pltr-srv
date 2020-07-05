import ('cross-fetch/polyfill')
import { AuthServiceError } from './index'
import { CognitoUserPool, AuthenticationDetails, CognitoUser, CognitoRefreshToken } from 'amazon-cognito-identity-js'
import { MessageLogger } from 'ais-tools'
import { decode, verify } from 'jsonwebtoken'
import { default as jwkToPem } from 'jwk-to-pem'

export interface IPoolData {
    UserPoolId: string,
    ClientId: string
}

export interface IUserLogin {
    Username: string,
    Password: string
}

export class AuthServiceClass {
    private logger: MessageLogger
    private poolData: IPoolData
    private pems: any = {}

    constructor(config: any, logger: MessageLogger) {
        this.poolData = config.poolData
        this.logger = logger
        this.keysToPem(config.keys)
    }

    public async Login(userLogin: IUserLogin) {
        const userPool = new CognitoUserPool(this.poolData)
        const authenticationDetails = new AuthenticationDetails(userLogin)
        const userData = { Username: userLogin.Username, Pool: userPool }
        const cognitoUser = new CognitoUser(userData)

        return new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    this.logger.warn('Login success', userLogin.Username)
                    resolve({
                        'access': result.getAccessToken().getJwtToken(),
                        'id': result.getIdToken().getJwtToken(),
                        'refresh': result.getRefreshToken().getToken()
                    })
                },
                onFailure: (err) => {
                    this.logger.warn('Login failure', userLogin)
                    reject(err)
                }
            })
        })
    }

    private keysToPem(keys): void {
        for (var i = 0; i < keys.length; i++) {
            this.pems[keys[i].kid] = jwkToPem({ kty: keys[i].kty, n: keys[i].n, e: keys[i].e })
        }
    }

    public async Verify(token) {
        return new Promise((resolve, reject) => {
            const decodedJwt = decode(token, { complete: true }) as any
            if (!decodedJwt) {
                this.logger.warn('Verify: Not a valid JWT token (decodedJwt)')
                reject(new AuthServiceError("Not a valid JWT token (decodedJwt)"))
            }

            const pem = this.pems[decodedJwt.header.kid]
            if (!pem) {
                this.logger.warn('Verify: Not a valid JWT token (pem)')
                reject(new AuthServiceError("Not a valid JWT token (pem)"))
            }

            verify(token, pem, (err, payload) => {
                if (err) {
                    this.logger.warn('Verify: Not a valid JWT token (verify)', err)
                    reject(new AuthServiceError("Not a valid JWT token (verify)"))
                } else {
                    this.logger.warn('Verify: success', payload)
                    resolve(payload)
                }
            })
        })
    }

    public async Refresh(username, token) {
        const RefreshToken = new CognitoRefreshToken({ RefreshToken: token })
        const userPool = new CognitoUserPool(this.poolData)
        const userData = { Username: username, Pool: userPool }
        const cognitoUser = new CognitoUser(userData)

        return new Promise((resolve, reject) => {
            cognitoUser.refreshSession(RefreshToken, (err, session) => {
                if (err) {
                    this.logger.warn('Refresh: ' + err.message)
                    reject(new AuthServiceError(err.message))
                } else {
                    this.logger.warn('Refresh: success')
                    resolve({
                        'access': session.accessToken.jwtToken,
                        'id': session.idToken.jwtToken,
                        'refresh': session.refreshToken.token
                    })
                }
            })
        })
    }
}
