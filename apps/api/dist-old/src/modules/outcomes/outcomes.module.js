"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomesModule = void 0;
const common_1 = require("@nestjs/common");
const outcomes_controller_1 = require("./outcomes.controller");
const outcomes_service_1 = require("./outcomes.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let OutcomesModule = class OutcomesModule {
};
exports.OutcomesModule = OutcomesModule;
exports.OutcomesModule = OutcomesModule = __decorate([
    (0, common_1.Module)({
        controllers: [outcomes_controller_1.OutcomesController],
        providers: [outcomes_service_1.OutcomesService, prisma_service_1.PrismaService]
    })
], OutcomesModule);
//# sourceMappingURL=outcomes.module.js.map