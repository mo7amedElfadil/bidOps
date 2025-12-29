"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_openidconnect_1 = require("passport-openidconnect");
let OidcStrategy = class OidcStrategy extends (0, passport_1.PassportStrategy)(passport_openidconnect_1.Strategy, 'oidc') {
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
        }, (iss, sub, profile, jwtClaims, accessToken, refreshToken, done) => {
            const email = profile?.emails?.[0]?.value || jwtClaims?.email;
            const name = profile?.displayName || jwtClaims?.name || email;
            const tenantId = jwtClaims?.tid || 'default';
            const role = 'VIEWER';
            return done(null, { sub, email, name, tenantId, role });
        });
    }
};
exports.OidcStrategy = OidcStrategy;
exports.OidcStrategy = OidcStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], OidcStrategy);
//# sourceMappingURL=oidc.strategy.js.map