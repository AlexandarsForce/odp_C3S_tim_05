import { ValidationResult } from "../../../Domain/types/ValidationResult";
import { CreatePostDto } from "../../../Domain/DTOs/posts/CreatePostDto";
import { UpdatePostDto } from "../../../Domain/DTOs/posts/UpdatePostDto";

export const validateCreatePost = (dto: CreatePostDto): ValidationResult => {
    if (!dto.title || dto.title.trim().length < 5 || dto.title.trim().length > 200)
        return { valid: false, message: "Post title is required and must be between 5 and 200 characters" };
    if (!dto.content || dto.content.trim().length < 10 || dto.content.trim().length > 10000)
        return { valid: false, message: "Post content is required and must be between 10 and 10000 characters" };
    return { valid: true };
}

export const validateUpdatePost = (dto: UpdatePostDto): ValidationResult => {
    if (!dto.title || dto.title.trim().length < 5 || dto.title.trim().length > 200)
        return { valid: false, message: "Post title is required and must be between 5 and 200 characters" };
    if (!dto.content || dto.content.trim().length < 10 || dto.content.trim().length > 10000)
        return { valid: false, message: "Post content is required and must be between 10 and 10000 characters" };
    return { valid: true };
}