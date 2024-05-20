import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { sendNotFound } from './utils';
import { sendFile } from './file';
import { Response } from './http-response';
import { executeGuard } from './http-route-handler';
import { AnyKaliRequest, RangeHeader, StaticRouteConfig } from './types';
import { validateHeaders, validateParams, validateQuery } from './validators';
import { resolve, relative } from 'path'

const sendIndex = (res: HttpResponse, range: RangeHeader | undefined, config: StaticRouteConfig) => {
    const index = resolve(config.rootDirectory, config.index ?? 'index.html')
    sendFile(res, index, range, {}, (err) => {
        if (err) {
            sendNotFound(res);
        }
    });
}

const processRequest = (res: HttpResponse, pattern: string, url: string, range: RangeHeader | undefined, config: StaticRouteConfig) => {
    if (pattern === url && config.index) {
        sendIndex(res, range, config);
        return;
    }
    const relativePath = relative(pattern, url);
    const resolvedPath = resolve(config.rootDirectory, relativePath)

    sendFile(res, resolvedPath, range, {}, (err) => {
        if (!err) {
            return
        }
        if (config.redirectNotFoundToIndex && config.index) {
            sendIndex(res, range, config);
            return;
        }
        sendNotFound(res);
    })
}

export const createStaticRouteHandler = (context: any, pattern: string, config: StaticRouteConfig) => {
    return (res: HttpResponse, req: HttpRequest) => {
        res.onAborted(() => res.aborted = true);
        let request: AnyKaliRequest = {
            method: req.getMethod() as AnyKaliRequest['method'],
            url: req.getUrl(),
            params: {},
            query: {},
            headers: {},
            body: undefined,
        }
        let range: RangeHeader | undefined = undefined
        const response = new Response(res, undefined);
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

        req.forEach((key, value) => {
            if (key === 'range') {
                range = value as RangeHeader
            }
        })

        if (config.guard) {
            executeGuard(response, request, context, config.guard, (err, valid) => {
                if (err) {
                    response.sendBytes('Internal server error', { statusCode: 500 })
                }
                if (valid) {
                    processRequest(res, pattern, request.url, range, config);
                }
            })
        } else {
            processRequest(res, pattern, request.url, range, config);
        }
    }
}
