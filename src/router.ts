import { TemplatedApp } from 'uWebSockets.js';
import { HttpRouteConfigBuilder } from './http-route-config';
import { StaticConfigBuilder } from './static-route-config';
import { KaliHttpRouteConfigBuilder, KaliRouter, KaliStaticConfigBuilder, KaliWebSocketRouteConfigBuilder } from './types';

export class Router<Context> implements KaliRouter<Context> {
    constructor(
        private readonly urlPrefix: string,
        protected readonly app: TemplatedApp,
        protected context: Context
    ) {
    }

    public any(path: string): KaliHttpRouteConfigBuilder<this, Context> {
        return new HttpRouteConfigBuilder(this, this.app, this.context, 'any', `${this.urlPrefix}${path}`);
    }

    public del(path: string): KaliHttpRouteConfigBuilder<this, Context> {
        return new HttpRouteConfigBuilder(this, this.app, this.context, 'del', `${this.urlPrefix}${path}`);
    }

    public get(path: string): KaliHttpRouteConfigBuilder<this, Context> {
        return new HttpRouteConfigBuilder(this, this.app, this.context, 'get', `${this.urlPrefix}${path}`);
    }

    public head(path: string): KaliHttpRouteConfigBuilder<this, Context> {
        return new HttpRouteConfigBuilder(this, this.app, this.context, 'head', `${this.urlPrefix}${path}`);
    }

    public patch(path: string): KaliHttpRouteConfigBuilder<this, Context> {
        return new HttpRouteConfigBuilder(this, this.app, this.context, 'patch', `${this.urlPrefix}${path}`);
    }

    public post(path: string): KaliHttpRouteConfigBuilder<this, Context> {
        return new HttpRouteConfigBuilder(this, this.app, this.context, 'post', `${this.urlPrefix}${path}`);
    }

    public prefix(path: string, bind: (router: KaliRouter<Context>) => void): this {
        bind(new Router(`${this.urlPrefix}${path}`, this.app, this.context))

        return this;
    }

    public put(path: string): KaliHttpRouteConfigBuilder<this, Context> {
        return new HttpRouteConfigBuilder(this, this.app, this.context, 'put', `${this.urlPrefix}${path}`);
    }

    public trace(path: string): KaliHttpRouteConfigBuilder<this, Context> {
        return new HttpRouteConfigBuilder(this, this.app, this.context, 'trace', `${this.urlPrefix}${path}`);
    }

    public raw(bind: (app: any) => void): this {
        bind(this.app)

        return this;
    }

    public ws(path: string): KaliWebSocketRouteConfigBuilder<this, Context> {
        // TODO
        return { } as KaliWebSocketRouteConfigBuilder<this, Context>;
    }

    public static(path: string): KaliStaticConfigBuilder<this, Context> {
        return new StaticConfigBuilder(this, this.app, this.context, `${this.urlPrefix}${path}`)
    }

}
