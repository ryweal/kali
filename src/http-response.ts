import { Writable } from 'stream';
import { HttpResponse, RecognizedString } from 'uWebSockets.js';
import { createResponseWriteStream } from './stream';
import {
    Encoder,
    KaliResponse,
    KaliSendNoContentOptions,
    KaliSendOptions,
    KaliSendFileOptions,
} from './types';
import {
    sendFile
} from './file'
import { sendHeaders, sendNotFound } from './utils';

export class Response implements KaliResponse<any>{
    constructor(
        public readonly rawResponse: HttpResponse,
        private readonly encoder: Encoder<any> | undefined
    ) {
    }

    public send(payload: any, options?: KaliSendOptions): void {
        const encodedPayload = this.encoder!(payload)
        if (this.rawResponse.aborted) {
            return;
        }
        this.rawResponse.cork(() => {
            this.rawResponse.writeStatus(`${options?.statusCode ?? 200}`)
            this.rawResponse.writeHeader('Content-Type', `${options?.contentType ?? 'application/json'}`)
            if (options?.headers) {
                sendHeaders(this.rawResponse, options.headers);
            }
            this.rawResponse.end(encodedPayload)
        })
    }

    public sendFile(path: string, options?: KaliSendFileOptions): void {
        sendFile(this.rawResponse, path, undefined, options ?? {}, () => {
            sendNotFound(this.rawResponse)
        });
    }

    public sendBytes(payload: RecognizedString, options?: KaliSendOptions) {
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

    public sendStream(options?: KaliSendOptions): Writable {
        if (this.rawResponse.aborted) {
            throw new Error('Aborted')
        }
        this.rawResponse.cork(() => {
            this.rawResponse.writeStatus(`${options?.statusCode ?? 200}`);
            this.rawResponse.writeHeader('Content-Type', options?.contentType ?? 'application/octet-stream');
            if (options?.headers) {
                sendHeaders(this.rawResponse, options.headers);
            }
        });

        return createResponseWriteStream(this.rawResponse)
    }

    public sendNoContent(options?: KaliSendNoContentOptions) {
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
