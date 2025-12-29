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
exports.OutcomesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let OutcomesService = class OutcomesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get(opportunityId) {
        return this.prisma.outcome.findFirst({ where: { opportunityId }, orderBy: { date: 'desc' } });
    }
    set(opportunityId, data) {
        return this.prisma.outcome.create({
            data: {
                opportunityId,
                status: data.status,
                date: data.date ? new Date(data.date) : new Date(),
                winner: data.winner,
                awardValue: data.awardValue,
                notes: data.notes,
                reasonCodes: data.reasonCodes || []
            }
        });
    }
};
exports.OutcomesService = OutcomesService;
exports.OutcomesService = OutcomesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OutcomesService);
//# sourceMappingURL=outcomes.service.js.map