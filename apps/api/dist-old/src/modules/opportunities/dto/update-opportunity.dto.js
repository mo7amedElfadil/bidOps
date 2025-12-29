"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOpportunityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_opportunity_dto_1 = require("./create-opportunity.dto");
class UpdateOpportunityDto extends (0, swagger_1.PartialType)(create_opportunity_dto_1.CreateOpportunityDto) {
}
exports.UpdateOpportunityDto = UpdateOpportunityDto;
//# sourceMappingURL=update-opportunity.dto.js.map