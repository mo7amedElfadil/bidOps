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
exports.UpdateChecklistDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ChecklistItemDto {
    done;
    attachmentId;
    notes;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ChecklistItemDto.prototype, "done", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "attachmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChecklistItemDto.prototype, "notes", void 0);
class UpdateChecklistDto {
    bondPurchased;
    formsCompleted;
    finalPdfReady;
    portalCredentialsVerified;
    complianceCreated;
    clarificationsSent;
    pricingApproved;
}
exports.UpdateChecklistDto = UpdateChecklistDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", ChecklistItemDto)
], UpdateChecklistDto.prototype, "bondPurchased", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", ChecklistItemDto)
], UpdateChecklistDto.prototype, "formsCompleted", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", ChecklistItemDto)
], UpdateChecklistDto.prototype, "finalPdfReady", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", ChecklistItemDto)
], UpdateChecklistDto.prototype, "portalCredentialsVerified", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", ChecklistItemDto)
], UpdateChecklistDto.prototype, "complianceCreated", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", ChecklistItemDto)
], UpdateChecklistDto.prototype, "clarificationsSent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ChecklistItemDto),
    __metadata("design:type", ChecklistItemDto)
], UpdateChecklistDto.prototype, "pricingApproved", void 0);
//# sourceMappingURL=update-checklist.dto.js.map