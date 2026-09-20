// Shared helpers: pagination envelope and RFC3339 time conversion. Every
// store module and resource handler goes through these rather than repeating
// the arithmetic or the time-conversion dance inline.

import ballerina/time;

# Builds the `{count, next, previous, data}` envelope every collection GET uses.
#
# + count - total matching rows, ignoring `limit`/`offset`
# + 'limit - the page size that was requested
# + offset - the offset that was requested
# + basePath - the collection's own path, e.g. `/me/transactions`
# + return - next/previous relative URIs, or () when there is no such page
function paginationLinks(int count, int 'limit, int offset, string basePath) returns [string?, string?] {
    string? next = ();
    if offset + 'limit < count {
        next = string `${basePath}?limit=${'limit}&offset=${offset + 'limit}`;
    }
    string? previous = ();
    if offset > 0 {
        int previousOffset = offset - 'limit;
        if previousOffset < 0 {
            previousOffset = 0;
        }
        previous = string `${basePath}?limit=${'limit}&offset=${previousOffset}`;
    }
    return [next, previous];
}

# `time:Utc` -> RFC3339 string, the shape every `date-time` field in the
# contract carries.
#
# + t - the instant to render
# + return - the RFC3339 string
function toRfc3339(time:Utc t) returns string {
    return time:utcToString(t);
}

# The current instant as an RFC3339 string, for a `createdAt` column.
#
# + return - now, RFC3339
function nowAsString() returns string {
    return toRfc3339(time:utcNow());
}
