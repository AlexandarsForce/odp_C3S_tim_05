export enum CommunityAccessResult {
    Allowed   = "Allowed",
    NotFound  = "NotFound",   // community does not exist
    Forbidden = "Forbidden",  // community is private and user is not an active member
}
