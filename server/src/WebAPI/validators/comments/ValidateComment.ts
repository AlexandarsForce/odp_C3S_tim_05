import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { CreateCommentDto } from "../../../Domain/DTOs/comments/CreateCommentDto";
import { UpdateCommentDto } from "../../../Domain/DTOs/comments/UpdateCommentDto";

export const validateCreateComment = (dto: CreateCommentDto): ValidationResult => {
    if (!dto.postId || dto.postId <= 0)
        return { valid: false, message: "Invalid post ID" };
    if (!dto.content || dto.content.trim().length < 1 || dto.content.trim().length > 2000)
        return { valid: false, message: "Comment content is required and must be between 1 and 2000 characters" };
    return { valid: true };
};

export const validateUpdateComment = (dto: UpdateCommentDto): ValidationResult => {
    if (!dto.content || dto.content.trim().length < 1 || dto.content.trim().length > 2000)
        return { valid: false, message: "Comment content is required and must be between 1 and 2000 characters" };
    return { valid: true };
};
