import { HttpRequest } from 'uWebSockets.js';
import { ContentTypeHeader, HttpRouteConfig, Validator } from './types';


export const validateBody = (requestContentType: ContentTypeHeader, body: Buffer, config: HttpRouteConfig): any => {
    if (config.parseByContentType) {
        for (const [contentType, parser] of Object.entries(config.parseByContentType)) {
            if (requestContentType.type === contentType) {
                const validation = parser(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength))
                if (!validation.success) {
                    throw validation.errors
                }
                return validation.data;
            }
        }
    }

    if (config.parser) {
        const validation = config.parser(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength))
        if (!validation.success) {
            throw validation.errors
        }
        return validation.data;
    }

    return undefined
}

export const validateHeaders = (req: HttpRequest, validator: Validator<any, Record<string, string>>): Record<string, string> => {
    const headers: Record<string, string> = {}
    req.forEach((key, value) => {
        headers[key] = value;
    });

    const validation = validator(headers);

    if (!validation.success) {
        throw validation.errors
    }

    return validation.data ?? {};
}

export const validateParams = (req: HttpRequest, pattern: string, validator: Validator<any, Record<string, string>>): Record<string, string | number> => {
    const matches = pattern.matchAll(/:\w+/g)
    let i = 0;
    const p: Record<string, string> = {}
    for (const match of matches) {
        const paramName = match[0].substring(1);
        p[paramName] = req.getParameter(i);
        i++;
    }
    const validation = validator(p)
    if (!validation.success) {
        throw validation.errors
    }

    return validation.data ?? {};
}

export const validateQuery = (req: HttpRequest, validator: Validator<any, URLSearchParams>): Record<string, string | string[]> => {
    const validation = validator(new URLSearchParams(req.getQuery()))
    if (!validation.success) {
        throw validation.errors
    }

    return validation.data ?? {};
}
