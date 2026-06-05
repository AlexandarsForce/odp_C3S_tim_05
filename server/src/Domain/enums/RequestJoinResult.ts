export enum RequestJoinResult {
    Joined         = "Joined",          // public community — joined immediately
    Success        = "Success",         // private community — join request created (pending)
    NotFound       = "NotFound",        // community does not exist
    AlreadyMember  = "AlreadyMember",   // user already has active membership
    AlreadyPending = "AlreadyPending",  // user already has a pending request
    Banned         = "Banned",          // user is banned and cannot request again
    Unavailable    = "Unavailable",     // unexpected DB / service failure
}
