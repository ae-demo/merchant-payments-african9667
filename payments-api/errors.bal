// Small builders for the shared Error schema, so every handler renders the
// same shape instead of a one-off record literal.

import ballerina/http;

function badRequest(string message) returns ErrorBadRequest {
    return {body: {code: 400, message: message}};
}

function notFound(string message) returns ErrorNotFound {
    return {body: {code: 404, message: message}};
}

function internalError(string message) returns http:InternalServerError {
    return {body: {code: 500, message: message}};
}
