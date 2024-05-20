import { Writable, Readable } from 'stream';
import { HttpResponse } from 'uWebSockets.js';

export const createResponseWriteStream = (res: HttpResponse): Writable => {
    return new Writable({
        write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void): void {
            res.write(chunk);
            callback()
        },
        final(callback: (error?: (Error | null)) => void): void {
            res.end();
            callback()
        },
        destroy(error: Error | null, callback: (error?: (Error | null)) => void): void {
            res.close();
            callback()
        },
        writev(chunks: Array<{ chunk: any; encoding: BufferEncoding }>, callback: (error?: (Error | null)) => void): void {
            res.cork(() => {
                for (const chunk of chunks) {
                    res.write(chunk.chunk)
                }
            })
            callback()
        },
    })
}

export const createResponseReadStream = (res: HttpResponse): Readable => {
    const stream = new Readable({
        read(size: number): void {
        },
    })
    res.onAborted(() => {
        res.aborted = true;
        stream.destroy(new Error('Request aborted'))
    });
    res.onData((chunk, isLast) => {
        stream.push(Buffer.from(chunk))
        if (isLast) {
            stream.push(null)
        }
    });

    return stream;
}
