import { IUserRepository } from "../repositories/users/IUserRepository";
import { MentionDto } from "../DTOs/comments/MentionDto";

const MENTION_REGEX = /@([a-zA-Z0-9-]+)/g;

export async function parseMentions(content: string, userRepo: IUserRepository): Promise<MentionDto[]> {
    const usernames = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = MENTION_REGEX.exec(content)) !== null) {
        usernames.add(match[1].toLowerCase());
    }
    if (usernames.size === 0) return [];

    const mentions: MentionDto[] = [];
    for (const username of usernames) {
        try {
            const user = await userRepo.findByUsername(username);
            if (user.id !== 0) {
                mentions.push(new MentionDto(user.username, user.id));
            }
        } catch { /* skip unresolved usernames */ }
    }
    return mentions;
}
