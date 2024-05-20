import { TemplatedApp, us_socket_local_port } from 'uWebSockets.js';
import { Router } from './router';
import { KaliApp, KaliOptions } from './types';

const listen = (app: TemplatedApp, host: string, port: number): Promise<number> => {
    return new Promise((resolve, reject) => {
        app.listen(host, port, (listenSocket) => {
            if (!listenSocket) {
                reject();
            }
            resolve(us_socket_local_port(listenSocket));
        })
    })
}

export class App<Context> extends Router<Context> implements KaliApp<Context> {
    private readonly contextProvider: () => Promise<Context>
    private shutdown: (() => Promise<void>) | undefined = undefined;

    constructor(app: TemplatedApp, options?: KaliOptions<Context>) {
        super('', app, undefined as Context);
        this.contextProvider = options?.contextProvider ?? (() => Promise.resolve() as Promise<Context>);
    }

    public async listen(options?: { host?: string; port?: number }): Promise<this> {
        this.context = await this.contextProvider();
        const host = options?.host ?? 'localhost';

        try {
            const port = await listen(this.app, host, options?.port ?? 0);
            console.log(`Kali is ready on http://${host}:${port} !`);
        } catch (err) {
            if (this.shutdown) {
                await this.shutdown()
            }
        }

        return this
    }

    public onShutdown(handler: (context: Partial<Context> | undefined) => Promise<void>): this {
        this.shutdown = () => handler(this.context);
        return this;
    }

    async [Symbol.asyncDispose](): Promise<void> {
        return this.close();
    }

    public async close(): Promise<void> {
        try {
            if (this.shutdown) {
                await this.shutdown();
            }
        } finally {
            this.app.close();
        }
    }
}
