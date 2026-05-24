import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { CreateCommunityDto } from "../../../Domain/DTOs/communities/CreateCommunityDto";
import { UpdateCommunityDto } from "../../../Domain/DTOs/communities/UpdateCommunityDto";
import { CommunityType } from "../../../Domain/enums/CommunityType";

export const validateCreateCommunity = (dto: CreateCommunityDto): ValidationResult => {
    if (!dto.name || dto.name.trim().length < 2 || dto.name.trim().length > 80)
        return { valid: false, message: "Community name is required and must be between 2 and 80 characters" };
    if (dto.description.trim().length > 500) 
        return { valid: false, message: "Community description must be at most 500 characters" };
    if(!dto.type || !Object.values(CommunityType).includes(dto.type))
        return { valid: false, message: "Invalid community type" };
    return { valid: true };
}

export const validateUpdateCommunity = (dto: UpdateCommunityDto): ValidationResult => {
    if (!dto.name || dto.name.trim().length < 2 || dto.name.trim().length > 80)
        return { valid: false, message: "Community name is required and must be between 2 and 80 characters" };
    if (dto.description.trim().length > 500) 
        return { valid: false, message: "Community description must be at most 500 characters" };
    if(!dto.type || !Object.values(CommunityType).includes(dto.type))
        return { valid: false, message: "Invalid community type" };
    return { valid: true };
}