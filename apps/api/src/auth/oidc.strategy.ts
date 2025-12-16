import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-openidconnect'

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
	constructor() {
		super({
			issuer: process.env.OIDC_ISSUER,
			authorizationURL: process.env.OIDC_AUTH_URL,
			tokenURL: process.env.OIDC_TOKEN_URL,
			userInfoURL: process.env.OIDC_USERINFO_URL,
			clientID: process.env.OIDC_CLIENT_ID,
			clientSecret: process.env.OIDC_CLIENT_SECRET,
			callbackURL: process.env.OIDC_CALLBACK_URL,
			scope: ['openid', 'profile', 'email']
		}, (iss: string, sub: string, profile: any, jwtClaims: any, accessToken: string, refreshToken: string, done: any) => {
			const email = profile?.emails?.[0]?.value || jwtClaims?.email
			const name = profile?.displayName || jwtClaims?.name || email
			const tenantId = (jwtClaims?.tid as string) || 'default'
			const role = 'VIEWER'
			return done(null, { sub, email, name, tenantId, role })
		})
	}
}


