import { TemplatedApp } from 'uWebSockets.js';
import { createStaticRouteHandler } from './static-route-handler';
import {
    AnyKaliStaticConfigBuilder,
    AsyncGuard,
    Guard,
    KaliRouter,
    KaliStaticConfigBuilder, NextKaliStaticConfigBuilder, StaticOptions,
    StaticRouteConfig,
    Validator,
} from './types';

export class StaticConfigBuilder<
    State extends KaliRouter<any>,
    Context = undefined,
    Query = {},
    Headers = {},
    Params = {},
    Consumed extends keyof AnyKaliStaticConfigBuilder | '' = ''
> implements KaliStaticConfigBuilder<State, Context, Query, Headers, Params, Consumed> {
    private readonly config: StaticRouteConfig = {
        validateHeaders: undefined,
        validateQuery: undefined,
        validateParams: undefined,
        guard: undefined,
        index: undefined,
        redirectNotFoundToIndex: false,
        rootDirectory: '',
        chunkSize: undefined
    }

    constructor(
        private readonly router: State,
        private readonly app: TemplatedApp,
        private readonly context: Context,
        private readonly pattern: string
    ) {
    }

    public headers<Headers>(headers: Validator<Headers, Record<string, string>>) {
        this.config.validateHeaders = headers;

        return this as unknown as NextKaliStaticConfigBuilder<State, Context, Query, Headers, Params, Consumed | 'headers'>
    }

    public params<Params>(params: Validator<Params, Record<string, string>>) {
        this.config.validateParams = params;

        return this as unknown as NextKaliStaticConfigBuilder<State, Context, Query, Headers, Params, Consumed | 'params'>
    }

    public query<Query>(query: Validator<Query, URLSearchParams>) {
        this.config.validateQuery = query;

        return this as unknown as NextKaliStaticConfigBuilder<State, Context, Query, Headers, Params, Consumed | 'query'>
    }

    public guard(guard: Guard<Context, Query, Headers, Params, undefined, undefined> | AsyncGuard<Context, Query, Headers, Params, undefined, undefined>) {
        this.config.guard = guard;

        return this as unknown as NextKaliStaticConfigBuilder<State, Context, Query, Headers, Params, Consumed | 'query' | 'headers' | 'params' | 'guard'>
    }

    public serve(options: StaticOptions): State {
        this.config.rootDirectory = options.rootDirectory;
        this.config.index = options.index;
        this.config.redirectNotFoundToIndex = options.redirectNotFoundToIndex ?? false;
        this.config.chunkSize = options.chunkSize

        this.app.get(`${this.pattern}*`, createStaticRouteHandler(this.context, this.pattern, this.config))

        return this.router;
    }

}
