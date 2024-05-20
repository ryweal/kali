import { TemplatedApp } from 'uWebSockets.js';
import { createHttpRouteHandler } from './http-route-handler';
import {
    AsyncGuard,
    AsyncHandler,
    ContentType,
    Encoder,
    Guard,
    Handler,
    HttpRouteConfig,
    HttpRouteConfigBuilderKeys,
    KaliHttpRouteConfigBuilder,
    KaliRouter,
    NextKaliHttpRouteConfigBuilder, Validator,
} from './types';

export class HttpRouteConfigBuilder<
    State extends KaliRouter<any>,
    Context = undefined,
    Query extends Record<string, string | string[]> = {},
    Headers extends Record<string, string> = {},
    Params extends Record<string, string | number> = {}, Body = undefined,
    Payload = undefined,
    Consumed extends HttpRouteConfigBuilderKeys | '' = ''
> implements KaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, Consumed> {
    private readonly config: HttpRouteConfig = {
        validateHeaders: undefined,
        validateQuery: undefined,
        validateParams: undefined,
        stream: false,
        parseByContentType: undefined,
        parser: undefined,
        encodeByContentType: undefined,
        guard: undefined,
        encoder: undefined,
        handler: () => {}
    }

    constructor(
        private readonly router: State,
        private readonly app: TemplatedApp,
        private readonly context: Context,
        private readonly action: 'get' | 'post' | 'put' | 'patch' | 'del' | 'trace' | 'head' | 'any',
        private readonly pattern: string
    ) {
    }

    public asStream<Body = ReadableStream>() {
        this.config.stream = true;

        return this as unknown as NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, 'parse' | 'asStream' | Consumed>;
    }

    public guard(guard: Guard<Context, Query, Headers, Params, Body, Payload> | AsyncGuard<Context, Query, Headers, Params, Body, Payload>) {
        this.config.guard = guard;

        return this as unknown as NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "query" | "headers" | "params" | "guard" | "send" | "parse" | "asStream" | Consumed>
    }

    public handler(handler: Handler<Context, Query, Headers, Params, Body, Payload> | AsyncHandler<Context, Query, Headers, Params, Body, Payload>): State {
        this.config.handler = handler

        this.app[this.action](this.pattern, createHttpRouteHandler(this.context, this.pattern, this.config as any))

        return this.router;
    }

    public headers<Headers>(headers: Validator<Headers, Record<string, string>>): NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "headers" | Consumed> {
        this.config.validateHeaders = headers;

        return this as unknown as NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "headers" | Consumed>;
    }

    public params<Params>(params: Validator<Params, Record<string, string>>) {
        this.config.validateParams = params;

        return this as unknown as NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "params" | Consumed>;
    }

    public query<Query>(query: Validator<Query, URLSearchParams>) {
        this.config.validateQuery = query;

        return this as unknown as NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "query" | Consumed>;
    }

    public parse<Body>(parser: Validator<Body>): NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "parse" | "asStream" | Consumed>;
    public parse<Body>(parser: Record<ContentType, Validator<Body>>, defaultParser?: Validator<Body>): NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "parse" | "asStream" | Consumed>;
    public parse(parser: Validator<Body> | Record<ContentType, Validator<Body>>, defaultParser?: Validator<Body>) {
        if (defaultParser) {
            this.config.parseByContentType = parser as Record<ContentType, Validator<Body>>;
            this.config.parser = defaultParser;
        } else {
            this.config.parser = parser as Validator<Body>
        }
        return this as unknown as NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "parse" | "asStream" | Consumed>;
    }

    public send<Payload>(encoder: Encoder<Payload>): NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "send" | Consumed>;
    public send<Payload>(encoder: Record<ContentType, Encoder<Payload>>, defaultEncoder?: Encoder<Payload>): NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "send" | Consumed>;
    public send(encoder: Encoder<Payload> | Record<ContentType, Encoder<Payload>>, defaultEncoder?: Encoder<Payload>) {
        if (defaultEncoder) {
            this.config.encodeByContentType = encoder as Record<ContentType, Encoder<Payload>>;
            this.config.encoder = defaultEncoder;
        } else {
            this.config.encoder = encoder as Encoder<Payload>;
        }

        return this as unknown as NextKaliHttpRouteConfigBuilder<State, Context, Query, Headers, Params, Body, Payload, "send" | Consumed>;
    }
}
