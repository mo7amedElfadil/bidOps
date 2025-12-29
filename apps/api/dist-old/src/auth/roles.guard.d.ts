import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
export declare class RolesGuard implements CanActivate {
    private reflector;
    private jwt;
    constructor(reflector: Reflector, jwt: JwtService);
    canActivate(context: ExecutionContext): boolean;
}
