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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("./notifications.service");
class ListNotificationsQuery {
    status;
    page;
    pageSize;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListNotificationsQuery.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListNotificationsQuery.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ListNotificationsQuery.prototype, "pageSize", void 0);
class PreferenceDto {
    activity;
    channel;
    digestMode;
    enabled;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreferenceDto.prototype, "activity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['EMAIL', 'IN_APP']),
    __metadata("design:type", String)
], PreferenceDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['INSTANT', 'DAILY', 'WEEKLY', 'OFF']),
    __metadata("design:type", String)
], PreferenceDto.prototype, "digestMode", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], PreferenceDto.prototype, "enabled", void 0);
class SavePreferencesDto {
    items;
}
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SavePreferencesDto.prototype, "items", void 0);
class DefaultRoutingDto {
    activity;
    stage;
    userIds;
    businessRoleIds;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DefaultRoutingDto.prototype, "activity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DefaultRoutingDto.prototype, "stage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], DefaultRoutingDto.prototype, "userIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], DefaultRoutingDto.prototype, "businessRoleIds", void 0);
class SaveDefaultsDto {
    items;
}
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SaveDefaultsDto.prototype, "items", void 0);
let NotificationsController = class NotificationsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list(query, req) {
        return this.svc.listForUser(req.user?.id, req.user?.tenantId || 'default', query);
    }
    count(req) {
        return this.svc.countForUser(req.user?.id, req.user?.tenantId || 'default').then(unread => ({
            unread
        }));
    }
    markRead(id, req) {
        return this.svc.markRead(id, req.user?.id, req.user?.tenantId || 'default');
    }
    markUnread(id, req) {
        return this.svc.markUnread(id, req.user?.id, req.user?.tenantId || 'default');
    }
    markAllRead(req) {
        return this.svc.markAllRead(req.user?.id, req.user?.tenantId || 'default');
    }
    preferences(req) {
        return this.svc.listPreferences(req.user?.id);
    }
    savePreferences(body, req) {
        const items = body.items || [];
        const payload = items.map(item => ({
            activity: item.activity,
            channel: item.channel,
            digestMode: item.digestMode,
            enabled: item.enabled
        }));
        return this.svc.savePreferences(req.user?.id, payload);
    }
    listDefaults(req) {
        return this.svc.listDefaults(req.user?.tenantId || 'default');
    }
    saveDefaults(body, req) {
        return this.svc.saveDefaults(req.user?.tenantId || 'default', body.items || []);
    }
    deleteDefault(id, req) {
        return this.svc.deleteDefault(req.user?.tenantId || 'default', id);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListNotificationsQuery, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('count'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "count", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Patch)(':id/unread'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markUnread", null);
__decorate([
    (0, common_1.Post)('read-all'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllRead", null);
__decorate([
    (0, common_1.Get)('preferences'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "preferences", null);
__decorate([
    (0, common_1.Patch)('preferences'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SavePreferencesDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "savePreferences", null);
__decorate([
    (0, common_1.Get)('defaults'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "listDefaults", null);
__decorate([
    (0, common_1.Patch)('defaults'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SaveDefaultsDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "saveDefaults", null);
__decorate([
    (0, common_1.Delete)('defaults/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "deleteDefault", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map