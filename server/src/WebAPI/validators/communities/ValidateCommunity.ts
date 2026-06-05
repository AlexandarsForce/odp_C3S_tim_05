import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { CreateCommunityDto } from "../../../Domain/DTOs/communities/CreateCommunityDto";
import { UpdateCommunityDto } from "../../../Domain/DTOs/communities/UpdateCommunityDto";
import { CommunityType } from "../../../Domain/enums/CommunityType";

const MAX_RULES_LENGTH = 200;
const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 500;

export const validateCreateCommunity = (dto: CreateCommunityDto): ValidationResult => {
    if (!dto.name || dto.name.trim().length < 2 || dto.name.trim().length > 80)
        return { valid: false, message: "Community name is required and must be between 2 and 80 characters" };
    if (!dto.description || dto.description.trim().length < MIN_DESCRIPTION_LENGTH)
        return { valid: false, message: `Community description is required and must be at least ${MIN_DESCRIPTION_LENGTH} characters` };
    if (dto.description.trim().length > MAX_DESCRIPTION_LENGTH)
        return { valid: false, message: `Community description must be at most ${MAX_DESCRIPTION_LENGTH} characters` };
    if (dto.rules && dto.rules.trim().length > MAX_RULES_LENGTH)
        return { valid: false, message: `Community rules must be at most ${MAX_RULES_LENGTH} characters` };
    if(!dto.type || !Object.values(CommunityType).includes(dto.type))
        return { valid: false, message: "Invalid community type" };
    return { valid: true };
}

export const validateUpdateCommunity = (dto: UpdateCommunityDto): ValidationResult => {
    if (!dto.name || dto.name.trim().length < 2 || dto.name.trim().length > 80)
        return { valid: false, message: "Community name is required and must be between 2 and 80 characters" };
    if (!dto.description || dto.description.trim().length < MIN_DESCRIPTION_LENGTH)
        return { valid: false, message: `Community description is required and must be at least ${MIN_DESCRIPTION_LENGTH} characters` };
    if (dto.description.trim().length > MAX_DESCRIPTION_LENGTH)
        return { valid: false, message: `Community description must be at most ${MAX_DESCRIPTION_LENGTH} characters` };
    if (dto.rules && dto.rules.trim().length > MAX_RULES_LENGTH)
        return { valid: false, message: `Community rules must be at most ${MAX_RULES_LENGTH} characters` };
    if(!dto.type || !Object.values(CommunityType).includes(dto.type))
        return { valid: false, message: "Invalid community type" };
    return { valid: true };
}
