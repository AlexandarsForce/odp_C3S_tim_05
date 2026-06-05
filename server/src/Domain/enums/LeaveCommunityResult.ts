export enum LeaveCommunityResult {
    Success       = "Success",
    NotFound      = "NotFound",       // user is not a member of this community
    LastModerator = "LastModerator",  // user is the last moderator — cannot leave
}
