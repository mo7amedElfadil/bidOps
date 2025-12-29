export type Role = 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
