import { Readable, Writable } from 'stream';
import { RecognizedString, TemplatedApp } from 'uWebSockets.js';

export type Kali = <T = unknown>(options?: KaliOptions<T>) => KaliApp<T>;

export interface KaliApp<Context = undefined> extends KaliRouter<Context> {
  listen(options?: { host?: string; port?: number }): Promise<this>;
  onShutdown(
    handler: (context: Partial<Context> | undefined) => Promise<void>,
  ): this;
  close(): Promise<void>;
}

export interface KaliOptions<Context = undefined> {
  ssl?: {
    caFile?: string;
    certFile?: string;
    keyFile?: string;
    passphrase?: string;
    sslCiphers?: string;
    sslPreferLowMemoryUsage?: boolean;
    dhParamsFile?: string;
  };
  contextProvider?: () => Promise<Context>;
}

export interface KaliRouter<Context> {
  get(path: string): KaliHttpRouteConfigBuilder<this, Context>;
  post(path: string): KaliHttpRouteConfigBuilder<this, Context>;
  put(path: string): KaliHttpRouteConfigBuilder<this, Context>;
  patch(path: string): KaliHttpRouteConfigBuilder<this, Context>;
  del(path: string): KaliHttpRouteConfigBuilder<this, Context>;
  head(path: string): KaliHttpRouteConfigBuilder<this, Context>;
  trace(path: string): KaliHttpRouteConfigBuilder<this, Context>;
  any(path: string): KaliHttpRouteConfigBuilder<this, Context>;
  ws(path: string): KaliWebSocketRouteConfigBuilder<this, Context>;
  static(path: string): KaliStaticConfigBuilder<this, Context>;
  prefix(path: string, bind: (router: KaliRouter<Context>) => void): this;
  raw(bind: (app: TemplatedApp) => void): this;
}

interface ValidationSuccess<T> {
  success: true;
  data: T;
  errors: [];
}
interface ValidationError<T> {
  success: false;
  errors: any[];
}
export type Validator<T, I = unknown> = (
  input: I,
) => ValidationSuccess<T> | ValidationError<T>;
export type QueryValidator<Query> = Validator<Query, URLSearchParams>;
export type HeaderValidator<Headers> = Validator<
  Headers,
  Record<string, string>
>;
export type ParamsValidator<Params> = Validator<Params, Record<string, string>>;
export type BodyValidator<Body> = Validator<Body, unknown>;

export type Encoder<T> = (input: T) => string | Uint8Array;

export interface KaliSendNoContentOptions {
  statusCode?: number;
  headers?: Record<string, string>;
}
export interface KaliSendOptions {
  statusCode?: number;
  contentType?: ContentType;
  headers?: Record<string, string>;
}
export interface KaliSendFileOptions extends KaliSendOptions {
  chunkSize?: number;
}
export interface KaliResponse<Payload> {
  send: (payload: Payload, options?: KaliSendOptions) => void;
  sendBytes: (payload: RecognizedString, options?: KaliSendOptions) => void;
  sendFile: (path: string, options?: KaliSendFileOptions) => void;
  sendStream: (options?: KaliSendOptions) => Writable;
  sendNoContent: (options?: KaliSendNoContentOptions) => void;
}
export interface KaliRequest<Query, Headers, Params, Body> {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'trace' | 'head';
  url: string;
  query: Query;
  headers: Headers;
  params: Params;
  body: Body;
}
export type AnyKaliRequest = KaliRequest<any, any, any, any>;
export type AnyKaliResponse = KaliResponse<any>;

export interface ContentTypeHeader {
  type: ContentType;
  parameters: Record<string, string>;
}
export type ContentType = string;
export type RangeHeader = `bytes=${number}-` | `bytes=${number}-${number}`;

export type NextKaliHttpRouteConfigBuilder<
  State extends KaliRouter<any>,
  Context,
  Query,
  Headers,
  Params,
  Body,
  Payload,
  Consumed extends HttpRouteConfigBuilderKeys | '' = '',
> = Omit<
  KaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed
  >,
  Consumed
>;
export type HttpRouteConfigBuilderKeys = keyof KaliHttpRouteConfigBuilder<
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export type AsyncHandler<Context, Query, Headers, Params, Body, Payload> = (
  res: KaliResponse<Payload>,
  req: KaliRequest<Query, Headers, Params, Body>,
  context: Context,
) => Promise<void>;
export type AnyAsyncHandler = AsyncHandler<any, any, any, any, any, any>;
export type Handler<Context, Query, Headers, Params, Body, Payload> = (
  res: KaliResponse<Payload>,
  req: KaliRequest<Query, Headers, Params, Body>,
  context: Context,
) => void;
export type AnyHandler = Handler<any, any, any, any, any, any>;

export type AsyncGuard<Context, Query, Headers, Params, Body, Payload> = (
  res: KaliResponse<Payload>,
  req: KaliRequest<Query, Headers, Params, Body>,
  context: Context,
) => Promise<boolean>;
export type AnyAsyncGuard = AsyncGuard<any, any, any, any, any, any>;
export type Guard<Context, Query, Headers, Params, Body, Payload> = (
  res: KaliResponse<Payload>,
  req: KaliRequest<Query, Headers, Params, Body>,
  context: Context,
  next: (allowed: boolean) => void,
) => void;
export type AnyGuard = Guard<any, any, any, any, any, any>;

export interface HttpRouteConfig {
  validateHeaders: HeaderValidator<any> | undefined;
  validateQuery: QueryValidator<any> | undefined;
  validateParams: ParamsValidator<any> | undefined;
  stream: boolean;
  parseByContentType: Record<ContentType, Validator<any>> | undefined;
  parser: BodyValidator<any> | undefined;
  encodeByContentType: Record<ContentType, Encoder<any>> | undefined;
  encoder: Encoder<any> | undefined;
  guard: AnyGuard | AnyAsyncGuard | undefined;
  handler: AnyHandler | AnyAsyncHandler;
}
export interface KaliHttpRouteConfigBuilder<
  State extends KaliRouter<any>,
  Context = undefined,
  Query = {},
  Headers = {},
  Params = {},
  Body = undefined,
  Payload = undefined,
  Consumed extends HttpRouteConfigBuilderKeys | '' = '',
> {
  query<Query>(
    query: Validator<Query, URLSearchParams>,
  ): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed | 'query'
  >;
  headers<Headers>(
    headers: Validator<Headers, Record<string, string>>,
  ): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed | 'headers'
  >;
  params<Params>(
    params: Validator<Params, Record<string, string>>,
  ): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed | 'params'
  >;
  parse<Body>(
    parser: Validator<Body>,
  ): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed | 'parse' | 'asStream'
  >;
  parse<Body>(
    parser: Record<ContentType, Validator<Body>>,
    defaultParser?: Validator<Body>,
  ): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed | 'parse' | 'asStream'
  >;
  asStream<Body = Readable>(): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed | 'parse' | 'asStream'
  >;
  send<Payload>(
    encoder: Encoder<Payload>,
  ): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed | 'send'
  >;
  send<Payload>(
    encoder: Record<ContentType, Encoder<Payload>>,
    defaultEncoder?: Encoder<Payload>,
  ): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    Consumed | 'send'
  >;
  guard(
    guard:
      | Guard<Context, Query, Headers, Params, Body, Payload>
      | AsyncGuard<Context, Query, Headers, Params, Body, Payload>,
  ): NextKaliHttpRouteConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Body,
    Payload,
    | Consumed
    | 'query'
    | 'headers'
    | 'params'
    | 'guard'
    | 'send'
    | 'parse'
    | 'asStream'
  >;
  handler(
    handler:
      | Handler<Context, Query, Headers, Params, Body, Payload>
      | AsyncHandler<Context, Query, Headers, Params, Body, Payload>,
  ): State;
  //proxy
}

export type WebSocketConfigBuilderKeys = keyof KaliWebSocketRouteConfigBuilder<
  any,
  any,
  any,
  any
>;
export type NextWebSocketRouteConfigBuilder<
  State extends KaliRouter<any>,
  Context,
  User,
  Consumed extends WebSocketConfigBuilderKeys | '' = '',
> = Omit<
  KaliWebSocketRouteConfigBuilder<State, Context, User, Consumed>,
  Consumed
>;
export interface KaliWebSocketRouteConfigBuilder<
  State extends KaliRouter<any>,
  Context = undefined,
  User = undefined,
  Consumed extends WebSocketConfigBuilderKeys | '' = '',
> {
  upgrade<User>(): NextWebSocketRouteConfigBuilder<
    State,
    Context,
    User,
    Consumed | 'upgrade'
  >;
  handler(): State;
}

export interface StaticRouteConfig {
  validateHeaders: HeaderValidator<any> | undefined;
  validateQuery: QueryValidator<any> | undefined;
  validateParams: ParamsValidator<any> | undefined;
  guard: AnyGuard | AnyAsyncGuard | undefined;
  rootDirectory: string;
  redirectNotFoundToIndex: boolean;
  index?: string;
  rangeSize?: number;
  highWaterMark?: number;
}
export type AnyKaliStaticConfigBuilder = KaliStaticConfigBuilder<
  any,
  any,
  any,
  any,
  any
>;
export type StaticConfigBuilderKeys = keyof AnyKaliStaticConfigBuilder;
export type NextKaliStaticConfigBuilder<
  State extends KaliRouter<any>,
  Context,
  Query,
  Headers,
  Params,
  Consumed extends StaticConfigBuilderKeys | '' = '',
> = Omit<
  KaliStaticConfigBuilder<State, Context, Query, Headers, Params, Consumed>,
  Consumed
>;
export interface KaliStaticConfigBuilder<
  State extends KaliRouter<any>,
  Context,
  Query = {},
  Headers = {},
  Params = {},
  Consumed extends StaticConfigBuilderKeys | '' = '',
> {
  query<Query>(
    query: Validator<Query, URLSearchParams>,
  ): NextKaliStaticConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Consumed | 'query'
  >;
  headers<Headers>(
    headers: Validator<Headers, Record<string, string>>,
  ): NextKaliStaticConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Consumed | 'headers'
  >;
  params<Params>(
    params: Validator<Params, Record<string, string>>,
  ): NextKaliStaticConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Consumed | 'params'
  >;
  guard(
    guard:
      | Guard<Context, Query, Headers, Params, undefined, undefined>
      | AsyncGuard<Context, Query, Headers, Params, undefined, undefined>,
  ): NextKaliStaticConfigBuilder<
    State,
    Context,
    Query,
    Headers,
    Params,
    Consumed | 'query' | 'headers' | 'params' | 'guard'
  >;
  serve(options: StaticOptions): State;
}
export interface StaticOptions {
  rootDirectory: string;
  index?: string;
  redirectNotFoundToIndex?: boolean;
  rangeSize?: number;
  highWaterMark?: number;
}
