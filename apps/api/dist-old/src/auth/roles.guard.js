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
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("./roles.decorator");
const jwt_1 = require("@nestjs/jwt");
let RolesGuard = class RolesGuard {
    reflector;
    jwt;
    constructor(reflector, jwt) {
        this.reflector = reflector;
        this.jwt = jwt;
    }
    canActivate(context) {
        const required = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (!required || required.length === 0)
            return true;
        const req = context.switchToHttp().getRequest();
        let user = req.user;
        if (!user?.role) {
            const auth = req.headers?.authorization || req.headers?.Authorization;
            if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
                try {
                    const payload = this.jwt.verify(auth.slice(7), {
                        secret: process.env.JWT_SECRET || 'dev-secret'
                    });
                    user = {
                        userId: payload.sub,
                        email: payload.email,
                        role: payload.role,
                        tenantId: payload.tenantId
                    };
                    req.user = user;
                }
                catch {
                    return false;
                }
            }
        }
        if (!user?.role)
            return false;
        return required.includes(user.role);
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, jwt_1.JwtService])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map