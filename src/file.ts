import { createReadStream, readFile, stat } from 'fs';
import { HttpResponse } from 'uWebSockets.js';
import { contentType } from 'mime-types';
import { extname } from 'path';
import { sendInternalServerError, sendHeaders } from './utils';
import { KaliSendFileOptions, RangeHeader } from './types';
import { constants } from 'http2'

const parseRangeHeader = (range: RangeHeader): { start: number, end: number } => {
    let [start, end] = range.substring(6).split('-', 2).map((e: string) => +e);
    return {
        start: isNaN(start) ? 0 : start,
        end: isNaN(end) ? 0 : end,
    };
}

const sizeFromRange = (
    range: RangeHeader | { start: number, end: number } | undefined,
    chunkSize: number
): { start: number, end: number } => {
    if (range === undefined) {
        return { start: 0, end: chunkSize }
    }

    if (typeof range === 'string') {
        return parseRangeHeader(range);
    }

    return range
}

export const sendFile = (
    res: HttpResponse,
    path: string,
    range: RangeHeader | { start: number, end: number } | undefined,
    options: KaliSendFileOptions,
    callback: (err: unknown) => void
): void => {
    const chunkSize = options?.chunkSize ?? 4 * 1024 * 1024;
    let { start, end } = sizeFromRange(range, chunkSize)
    let buffer: Buffer
    stat(path, (err, stats) => {
        if (err) {
            callback(err)
            return;
        }
        if (range === undefined && stats.size <= chunkSize) {
            readFile(path, (err, buffer) => {
                if (err) {
                    callback(err)
                    return;
                }
                if (res.aborted) {
                    return;
                }
                res.cork(() => {
                    res.writeStatus(`${ options?.statusCode ?? 200 }`);
                    res.writeHeader(constants.HTTP2_HEADER_CONTENT_TYPE, options?.contentType || contentType(extname(path)) || 'application/octet-stream');
                    if (options?.headers) {
                        sendHeaders(res, options.headers);
                    }
                    res.end(buffer);
                });
            })
            return;
        }
        try {
            end = Math.min(start + chunkSize, stats.size);
            createReadStream(path, {
                start,
                end,
                highWaterMark: chunkSize
            }).on('data', chunk => {
                const chunkBuffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
                buffer = buffer ? Buffer.concat([buffer, chunkBuffer]) : chunkBuffer
            }).on('end', () => {
                if (res.aborted) {
                    return;
                }
                res.cork(() => {
                    res.writeStatus('206')
                    res.writeHeader(constants.HTTP2_HEADER_CONTENT_RANGE, `bytes ${start}-${end-1}/${stats.size}`)
                    res.writeHeader(constants.HTTP2_HEADER_CONTENT_TYPE, options?.contentType || contentType(extname(path)) || 'application/octet-stream')
                    if (options?.headers) {
                        sendHeaders(res, options.headers);
                    }
                    res.end(buffer);
                })
            }).on('error', () => {
                sendInternalServerError(res)
            })
        } catch (err: unknown) {
            sendInternalServerError(res)
        }
    })
}
