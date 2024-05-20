import { safeParse } from 'fast-content-type-parse';
import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { createResponseReadStream } from './stream';
import {
    AnyAsyncGuard,
    AnyGuard,
    AnyKaliRequest,
    AnyKaliResponse,
    HttpRouteConfig,
    KaliRequest,
} from './types';
import { Response } from './http-response'
import { validateBody, validateHeaders, validateParams, validateQuery } from './validators';

const read = (res: HttpResponse, cb: (buffer: Buffer | null) => void): void => {
    let buffer: Buffer;
    res.onData((ab, isLast) => {
        let chunk = Buffer.from(ab);
        if (isLast) {
            cb(buffer ? Buffer.concat([buffer, chunk]) : chunk);
        } else {
            buffer = buffer ? Buffer.concat([buffer, chunk]) : Buffer.concat([chunk]);
        }
    });
    res.onAborted(() => {
        res.aborted = true;
        cb(null);
    });
}

export const executeGuard = (response: AnyKaliResponse, request: AnyKaliRequest, context: any, guard: AnyGuard | AnyAsyncGuard, callback: (err: unknown, valid: boolean) => void): void => {
    const promise = guard(response, request, context, valid => {
        callback(null, valid)
    });
    if (promise && typeof promise.catch =='function') {
        promise.catch(err => {
            callback(err, false)
        })
    }
    if (promise && typeof promise.then =='function') {
        promise.then(valid => {
            callback(null, valid)
        })
    }
}

const executeHandler = (response: AnyKaliResponse, request: AnyKaliRequest, context: any, config: HttpRouteConfig): void => {
    try {
        const promise = config.handler(response, request, context)
        if (promise && typeof promise.catch =='function') {
            promise.catch(() => {
                response.sendBytes('Internal server error', { statusCode: 500 })
            })
        }
    } catch (err: unknown) {
        response.sendBytes('Internal server error', { statusCode: 500 })
        return;
    }
}

const processRequest = (res: HttpResponse, req: HttpRequest, response: AnyKaliResponse, request: AnyKaliRequest, context: any, config: HttpRouteConfig): void => {
    if (config.stream || !config.parser) {
        if (config.stream) {
            request.body = createResponseReadStream(res)
        }
        executeHandler(response, request, context, config)
    } else {
        const contentType = safeParse(req.getHeader('content-type'));
        read(res, (buffer) => {
            if (!buffer) {
                console.error('No buffer to read');
                response.sendBytes('Internal server error', { statusCode: 500 })
                return;
            }
            try {
                request.body = validateBody(contentType, buffer, config)
            } catch (err: unknown) {
                response.sendBytes('Bad request', { statusCode: 400 })
                return;
            }
            executeHandler(response, request, context, config)
        })
    }
}

export const createHttpRouteHandler = (context: any, pattern: string, config: HttpRouteConfig) => {
    return (res: HttpResponse, req: HttpRequest) => {
        res.onAborted(() => res.aborted = true);
        let request: KaliRequest<any, any, any, any> = {
            method: req.getMethod() as KaliRequest<any, any, any, any>['method'],
            url: req.getUrl(),
            params: {},
            query: {},
            headers: {},
            body: undefined,
        }
        const response = new Response(res, config.encoder);
        try {
            if (config.validateParams) {
                request.params = validateParams(req, pattern, config.validateParams);
            }
            if (config.validateQuery) {
                request.query = validateQuery(req, config.validateQuery as any);
            }
            if (config.validateHeaders) {
                request.headers = validateHeaders(req, config.validateHeaders as any);
            }
        } catch (err: unknown) {
            response.sendBytes('Bad request', { statusCode: 400 })
            return;
        }

        if (config.guard) {
            executeGuard(response, request, context, config.guard, (err, valid) => {
                if (err) {
                    response.sendBytes('Internal server error', { statusCode: 500 })
                }
                if (valid) {
                    processRequest(res, req, response, request, context, config);
                }
            })
        } else {
            processRequest(res, req, response, request, context, config);
        }
    }
}
