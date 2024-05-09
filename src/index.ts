import { createReadStream, stat } from 'fs';
import { readFile } from 'fs/promises';
import typia, { IValidation } from 'typia';
import { HttpRequest, HttpResponse, TemplatedApp, App as uWebSocketsApp, SSLApp as uWebSocketsSSLApp } from 'uWebSockets.js';
import { safeParse } from 'fast-content-type-parse'

export type Kali = <T = unknown>(options?: KaliOptions<T>) => KaliApp<T>
export interface KaliOptions<T> {
    ssl?: {
        caFile?: string
        certFile?: string
        keyFile?: string,
        passphrase?: string
        sslCiphers?: string
        sslPreferLowMemoryUsage?: boolean
        dhParamsFile?: string
    },
    contextProvider?: () => Promise<T>
}
export interface KaliRouter<T> {
    prefix(path: string, router: (router: KaliRouter<T>) => void): this
    get<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
    post<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
    put<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
    patch<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
    del<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
    options<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
    trace<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
    head<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
    any<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined,
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this
}

export interface KaliApp<T> extends KaliRouter<T> {
    listen(options?: { host?: string, port?: number }, callback?: () => void): Promise<this>
    onShutdown(handler: (context: Partial<T> | undefined) => Promise<void>): this
    close(): Promise<void>
    [Symbol.asyncDispose](): Promise<void>
}

export interface Route<
    Query extends Record<string, string | string[]> = {},
    Params extends Record<string, string> = {},
    Headers extends Record<string, string> = {},
    Body = undefined,
    JsonResponse = undefined,
    ProtobufResponse = undefined,
    Context = undefined
> {
    query?: (v: typeof typia.http.createValidateQuery) => ReturnType<typeof typia.http.createValidateQuery<Query>>
    params?: (v: typeof typia.createValidate) => ReturnType<typeof typia.createValidate<Params>>
    headers?: (v: typeof typia.createValidate) => ReturnType<typeof typia.createValidate<Headers>>

    jsonParser?: (v: typeof typia.json.createStringify) => ReturnType<typeof typia.json.createValidateParse<Body>>
    protobufDecode?: (v: typeof typia.protobuf.createDecode) => ReturnType<typeof typia.protobuf.createValidateDecode<Body>>

    jsonSerialize?: (v: typeof typia.json.createStringify) => ReturnType<typeof typia.json.createStringify<JsonResponse>>
    protobufEncode?: (v: typeof typia.protobuf.createEncode) => ReturnType<typeof typia.protobuf.createEncode<ProtobufResponse>>

    handler: Handler<Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, Context>>
}

export type KaliRequest<R extends Route<any, any, any, any, any, any, any>> = R extends Route<infer Query, infer Params, infer Headers, infer Body, any, any, any> ? {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'trace' | 'head'
    url: string,
    query: Query
    params: Params
    headers: Headers
    body: Body
} : never

type KaliJsonResponse<R extends Route<any, any, any, any, any, any, any>> = R extends Route<any, any, any, any, infer JsonPayload, any, any> ? JsonPayload extends undefined ? {} : {
    sendJson(payload: JsonPayload, options?: { statusCode?: number, headers?: Record<string, string> }): void
} : never;
type KaliProtobufResponse<R extends Route<any, any, any, any, any, any, any>> = R extends Route<any, any, any, any, any, infer ProtobufPayload, any> ? ProtobufPayload extends undefined ? {} : {
    sendProtobuf(payload: ProtobufPayload, options?: { statusCode?: number, headers?: Record<string, string> }): void
} : never;
export type RangeHeader = `bytes=${number}-` | `bytes=${number}-${number}`;
export type KaliResponse<R extends Route<any, any, any, any, any, any, any>> = {
    send(payload: string | Buffer, options?: { statusCode?: number, contentType?: string, headers?: Record<string, string> }): void
    sendNoContent(options?: { statusCode?: number, headers?: Record<string, string> }): void
    sendFile(path: string, options?: { statusCode?: number, contentType?: string, headers?: Record<string, string> }): Promise<void>
    sendPartialFile(path: string, range: RangeHeader | { start: number, end: number } | undefined, options?: { statusCode?: number, contentType?: string, headers?: Record<string, string>, chunkSize?: number }): Promise<void>
    rawResponse: HttpResponse
} & KaliJsonResponse<R> & KaliProtobufResponse<R>;

export type Handler<R extends Route<any, any, any, any, any, any, any>> = R extends Route<any, any, any, any, any, any, infer T>
    ? (ctx: KaliRequest<R>, res: KaliResponse<R>, context: T) => Promise<void>
    : never

interface Validators {
    query: ((input: any) => IValidation<Record<string, string | string[]>>) | undefined,
    params: ((input: any) => IValidation<Record<string, string>>) | undefined,
    headers: ((input: any) => IValidation<Record<string, string>>) | undefined,
    jsonParser: ((input: any) => IValidation) | undefined,
    protobufDecode: ((input: any) => IValidation) | undefined,
}

interface Serializers {
    jsonSerialize: ((input: any) => any) | undefined,
    protobufEncode: ((input: any) => any) | undefined,
}

const createValidators = (route: Route<any, any, any, any, any, any>): Validators => {
    return {
        query: route.query?.(typia.http.createValidateQuery),
        params: route.params?.(typia.createValidate),
        headers: route.headers?.(typia.createValidate),
        jsonParser: route.jsonParser?.(typia.json.createValidateParse),
        protobufDecode: route.protobufDecode?.(typia.protobuf.createValidateDecode),
    }
}

const createSerializers = (route: Route<any, any, any, any, any, any>): Serializers => {
    return {
        jsonSerialize: route.jsonSerialize?.(typia.json.createStringify),
        protobufEncode: route.protobufEncode?.(typia.protobuf.createEncode),
    }
}

interface ContentType {
    type: string;
    parameters: Record<string, string>;
}

const validateBody = (contentType: ContentType, body: Buffer, validators: Validators): any => {
    if (contentType.type === 'application/json' && validators.jsonParser) {
        const validation = validators.jsonParser(body.toString('utf-8'))
        if (!validation.success) {
            throw validation.errors
        }
        return validation.data;
    }

    if (contentType.type === 'application/protobuf' && validators.protobufDecode) {
        const validation = validators.protobufDecode(body)
        if (!validation.success) {
            throw validation.errors
        }
        return validation.data;
    }

    if (validators.jsonParser || validators.protobufDecode) {
        throw new Error('Invalid body')
    }
}

const validateHeaders = (req: HttpRequest, validator: (input: unknown) => IValidation<Record<string, string>>): Record<string, string> => {
    const headers: Record<string, string> = {}
    req.forEach((key, value) => {
        headers[key] = value;
    });

    const validation = validator(headers);

    if (!validation.success) {
        throw validation.errors
    }

    return validation.data;
}

const validateParams = (req: HttpRequest, pattern: string, validator: (input: unknown) => IValidation<Record<string, string>>): Record<string, string> => {
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

    return validation.data;
}

const validateQuery = (req: HttpRequest, validator: (input: unknown) => IValidation<Record<string, string | string[]>>): Record<string, string | string[]> => {
    const validation = validator(new URLSearchParams(req.getQuery()))
    if (!validation.success) {
        throw validation.errors
    }

    return validation.data;
}

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

const parseRangeHeader = (range: RangeHeader): { start: number, end: number } => {
    let [start, end] = range.substring(6).split('-', 2).map((e: string) => +e);
    return { start, end };
}

const sizeFromRange = (
    range: RangeHeader | { start: number, end: number } | undefined,
    chunkSize: number
): { start: number, end: number | undefined } => {
    if (range === undefined) {
        return { start: 0, end: chunkSize }
    }

    if (typeof range === 'string') {
        return parseRangeHeader(range);
    }

    return range
}

class Response implements KaliResponse<any>{
    constructor(public rawResponse: HttpResponse, private serializers: Serializers) {
    }
    public sendJson(payload: any, options?: { statusCode?: number, headers?: Record<string, string> }): void {
        if (this.rawResponse.aborted) {
            return;
        }
        this.rawResponse.cork(() => {
            this.rawResponse.writeStatus(`${options?.statusCode ?? 200}`)
            this.rawResponse.writeHeader('Content-Type', 'application/json')
            if (options?.headers) {
                sendHeaders(this.rawResponse, options.headers);
            }
            this.rawResponse.end(this.serializers.jsonSerialize?.(payload));
        })
    }

    public sendProtobuf(payload: any, options?: { statusCode?: number, headers?: Record<string, string> }): void {
        if (this.rawResponse.aborted) {
            return;
        }
        this.rawResponse.cork(() => {
            this.rawResponse.writeStatus(`${options?.statusCode ?? 200}`)
            this.rawResponse.writeHeader('Content-Type', 'application/protobuf')
            if (options?.headers) {
                sendHeaders(this.rawResponse, options.headers);
            }
            this.rawResponse.end(this.serializers.protobufEncode?.(payload));
        })
    }
    public async sendFile(path: string, options?: { statusCode?: number, contentType?: string, headers?: Record<string, string> }): Promise<void> {
        const buffer = await readFile(path);
        if (this.rawResponse.aborted) {
            return;
        }
        if (this.rawResponse.aborted) {
            return;
        }
        this.rawResponse.cork(() => {
            this.rawResponse.writeStatus(`${ options?.statusCode ?? 200 }`);
            this.rawResponse.writeHeader('Content-Type', options?.contentType ?? 'application/octet-stream');
            if (options?.headers) {
                sendHeaders(this.rawResponse, options.headers);
            }
            this.rawResponse.end(buffer);
        });
    }

    public sendPartialFile(
        path: string,
        range: RangeHeader | { start: number, end: number } | undefined,
        options?: {
            statusCode?: number,
            contentType?: string,
            headers?: Record<string, string>,
            chunkSize?: number
            highWaterMark?: number
        }
    ): Promise<void> {
        const chunkSize = options?.chunkSize ?? 4 * 1024 * 1024;
        let buffer: Buffer
        return new Promise((resolve, reject) => {
            stat(path, (err, stats) => {
                if (err) {
                    reject(err)
                    return;
                }
                try {
                    let { start, end } = sizeFromRange(range, chunkSize)
                    end = Math.min(start + chunkSize, stats.size);
                    createReadStream(path, {
                        start,
                        end,
                        highWaterMark: chunkSize
                    }).on('data', chunk => {
                        const chunkBuffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
                        buffer = buffer ? Buffer.concat([buffer, chunkBuffer]) : chunkBuffer
                    }).on('end', () => {
                        if (this.rawResponse.aborted) {
                            return;
                        }
                        this.rawResponse.cork(() => {
                            this.rawResponse.writeStatus('206')
                            this.rawResponse.writeHeader('Content-Range', `bytes ${start}-${end-1}/${stats.size}`)
                            this.rawResponse.writeHeader('Content-Type', options?.contentType ?? 'application/octet-stream')
                            if (options?.headers) {
                                sendHeaders(this.rawResponse, options.headers);
                            }
                            this.rawResponse.end(buffer);
                        })
                        resolve();
                    }).on('error', reject)
                } catch (err: unknown) {
                    reject(err);
                }
            })
        })
    }

    public send(payload: string | Buffer, options?: { statusCode?: number, contentType?: string, headers?: Record<string, string> }) {
        if (this.rawResponse.aborted) {
            return;
        }
        this.rawResponse.cork(() => {
            this.rawResponse.writeStatus(`${options?.statusCode ?? 200}`);
            this.rawResponse.writeHeader('Content-Type', options?.contentType ?? typeof payload ==='string' ? 'text/plain' : 'application/octet-stream');
            if (options?.headers) {
                sendHeaders(this.rawResponse, options.headers);
            }
            this.rawResponse.end(payload);
        });
    }

    public sendNoContent(options?: { statusCode?: number, contentType?: string, headers?: Record<string, string> }) {
        if (this.rawResponse.aborted) {
            return;
        }
        this.rawResponse.cork(() => {
            this.rawResponse.writeStatus(`${options?.statusCode ?? 204}`);
            if (options?.headers) {
                sendHeaders(this.rawResponse, options.headers);
            }
            this.rawResponse.endWithoutBody();
        });
    }
}

const sendHeaders = (res: HttpResponse, headers: Record<string, string>): void => {
    for (const [key, value] of Object.entries(headers)) {
        res.writeHeader(key, value);
    }
}

const createRouteHandler = (pattern: string, route: Route<any, any, any, any, any, any, any>, context: any): ((res: HttpResponse, req: HttpRequest) => void) => {
    const validators = createValidators(route);
    const serializers = createSerializers(route);

    return (res: HttpResponse, req: HttpRequest) => {
        res.onAborted(() => res.aborted = true);
        let request: KaliRequest<Route<any, any, any, any, any, any>> = {
            method: req.getMethod() as any,
            url: req.getUrl(),
            params: {},
            query: {},
            headers: {},
            body: undefined,
        }
        const response = new Response(res, serializers);
        try {
            if (validators.params) {
                request.params = validateParams(req, pattern, validators.params);
            }
            if (validators.query) {
                request.query = validateQuery(req, validators.query);
            }
            if (validators.headers) {
                request.headers = validateHeaders(req, validators.headers);
            }
        } catch (err: unknown) {
            response.send('Bad request', { statusCode: 400 })
            return;
        }
        if (request.method === 'post' || request.method === 'put' || request.method === 'patch') {
            const contentType = safeParse(req.getHeader('content-type'));
            read(res, (buffer) => {
                if(!buffer) {
                    console.error('No buffer to read');
                    response.send('Internal server error', { statusCode: 500 })
                    return;
                }

                request.body = validateBody(contentType, buffer, validators)

                route.handler(request, response, context.userContext).catch(err => {
                    console.error(err);
                    return response.send('Internal server error', { statusCode: 500 })
                })
            })
        } else {
            route.handler(request, response, context.userContext).catch(err => {
                console.error(err);
                return response.send('Internal server error', { statusCode: 500 })
            })
        }
    }
}

class Router<T> implements KaliRouter<T> {
    constructor(
        protected app: TemplatedApp,
        protected context: {
            userContext: T
        },
        private routePrefix: string = ''
    ) {}

    public prefix(prefix: string, callback: (router: KaliRouter<T>) => void): this {
        callback(new Router(this.app, this.context, `${this.routePrefix}${prefix}`));
        return this;
    }

    public get<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.get(path, createRouteHandler(path, route, this.context))
        return this;
    }

    public post<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.post(path, createRouteHandler(path, route, this.context))
        return this;
    }

    public put<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.put(path, createRouteHandler(path, route, this.context))
        return this;
    }

    public patch<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.patch(path, createRouteHandler(path, route, this.context))
        return this;
    }

    public del<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.del(path, createRouteHandler(path, route, this.context))
        return this;
    }

    public options<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.options(path, createRouteHandler(path, route, this.context))
        return this;
    }

    public trace<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.trace(path, createRouteHandler(path, route, this.context))
        return this;
    }

    public head<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.head(path, createRouteHandler(path, route, this.context))
        return this;
    }

    public any<
        Query extends Record<string, string | string[]> = {},
        Params extends Record<string, string> = {},
        Headers extends Record<string, string> = {},
        Body = undefined,
        JsonResponse = undefined,
        ProtobufResponse = undefined
    >(path: string, route: Route<Query, Params, Headers, Body, JsonResponse, ProtobufResponse, T>): this {
        this.app.any(path, createRouteHandler(path, route, this.context))
        return this;
    }
}

class App<T = unknown> extends Router<T> implements KaliApp<T> {
    private shutdown: (() => Promise<void>) | undefined = undefined;

    constructor(app: TemplatedApp, private contextProvider: () => Promise<T>) {
        super(app, { userContext: undefined as T }, '');

        process.on('SIGINT', () => (this.shutdown?.() ?? Promise.resolve()).finally(() => process.exit(1)));
        process.on('SIGTERM', () => (this.shutdown?.() ?? Promise.resolve()).finally(() => process.exit(1)));
    }

    public listen(options?: { host?: string; port?: number }): Promise<this> {
        return new Promise((resolve, reject) => {
            this.any('*', {
                handler: async (req,  res) => {
                    res.send('Not found', { statusCode: 404 })
                }
            });
            this.contextProvider().then(context => {
                this.context.userContext = context;
                const host = options?.host ?? 'localhost';
                const port = options?.port ?? 3000;
                this.app.listen(host, port, () => {
                    console.log(`Kali is ready on http://${host}:${port} !`);
                    resolve(this);
                })
            }).catch(err => (this.shutdown?.() ?? Promise.resolve()).then(() => reject(err)));
        })
    }

    public onShutdown(handler: (context: Partial<T> | undefined) => Promise<void>): this {
        this.shutdown = () => handler(this.context.userContext);
        return this;
    }

    async [Symbol.asyncDispose](): Promise<void> {
        return this.close();
    }

    public async close(): Promise<void> {
        try {
            await (this.shutdown?.() ?? Promise.resolve());
        } finally {
            this.app.close();
        }
    }
}

export const kali: Kali = <T = unknown>(options?: KaliOptions<T>) => {
    const contextProvider = options?.contextProvider ?? (() => Promise.resolve() as Promise<T>);
    if (options?.ssl) {
        return new App(uWebSocketsSSLApp({
            ssl_ciphers: options.ssl.sslCiphers,
            ssl_prefer_low_memory_usage: options.ssl?.sslPreferLowMemoryUsage,
            ca_file_name: options.ssl.caFile,
            cert_file_name: options.ssl.certFile,
            passphrase: options.ssl.passphrase,
            key_file_name: options.ssl.keyFile,
            dh_params_file_name: options.ssl.dhParamsFile,
        }), contextProvider)
    }

    return new App<T>(uWebSocketsApp(), contextProvider)
}
