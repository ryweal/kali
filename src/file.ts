import { createReadStream, stat } from 'node:fs';
import { HttpResponse } from 'uWebSockets.js';
import { contentType } from 'mime-types';
import { extname } from 'node:path';
import { sendHeaders } from './utils';
import { RangeHeader } from './types';
import { constants } from 'node:http2';

export const parseRangeHeader = (
  range: RangeHeader,
): { start: number; end?: number } => {
  let [start, end] = range
    .substring(6)
    .split('-', 2)
    .map((e: string) => +e);
  return {
    start: isNaN(start) ? 0 : start,
    end: isNaN(end) ? undefined : end,
  };
};

const sendFromStream = (
  res: HttpResponse,
  path: string,
  start: number,
  end: number,
  size: number,
  headers: Record<string, string> | undefined,
  highWaterMark: number,
  callback: (error?: unknown) => void,
) => {
  if (res.aborted) {
    return callback('aborted');
  }
  let isFirst = true;
  createReadStream(path, {
    start,
    end,
    highWaterMark,
  })
    .on('data', (chunk) => {
      if (res.aborted) {
        return callback('aborted');
      }
      res.cork(() => {
        if (isFirst) {
          res.writeStatus('206');
          res.writeHeader(
            constants.HTTP2_HEADER_RANGE,
            `bytes=${start}-${end - 1}/${size}`,
          );
          res.writeHeader(
            constants.HTTP2_HEADER_CONTENT_TYPE,
            contentType(extname(path)) || 'application/octet-stream',
          );
          if (headers) {
            sendHeaders(res, headers);
          }
          isFirst = false;
        }
        res.write(chunk);
      });
    })
    .on('end', () => {
      if (res.aborted) {
        return callback('aborted');
      }
      res.cork(() => {
        res.end();
      });
      callback();
    })
    .on('error', callback);
};

const sendFileRange = (
  res: HttpResponse,
  path: string,
  range: { start: number; end?: number },
  options: {
    highWaterMark: number;
    rangeSize: number;
    headers?: Record<string, string>;
  },
  callback: (err: unknown) => void,
) => {
  stat(path, (err, stats) => {
    if (err) {
      return callback(err);
    }
    if (range.start > stats.size) {
      return callback('Out of range');
    }
    sendFromStream(
      res,
      path,
      range.start,
      range.end ?? options.rangeSize,
      stats.size,
      options.headers,
      options.highWaterMark,
      callback,
    );
  });
};

const sendFullFile = (
  res: HttpResponse,
  path: string,
  options: { highWaterMark: number; headers?: Record<string, string> },
  callback: (err?: unknown) => void,
) => {
  let isFirst = true;
  createReadStream(path, {
    highWaterMark: options.highWaterMark,
  })
    .on('data', (chunk) => {
      if (res.aborted) {
        return callback('aborted');
      }
      res.cork(() => {
        if (isFirst) {
          res.writeStatus('200');
          res.writeHeader(
            constants.HTTP2_HEADER_CONTENT_TYPE,
            contentType(extname(path)) || 'application/octet-stream',
          );
          if (options.headers) {
            sendHeaders(res, options.headers);
          }
          isFirst = false;
        }
        res.write(chunk);
      });
    })
    .on('end', () => {
      if (res.aborted) {
        return callback('aborted');
      }
      res.cork(() => {
        res.end();
      });
      callback();
    })
    .on('error', callback);
};
export const sendFile = (
  res: HttpResponse,
  path: string,
  range: { start: number; end?: number } | undefined,
  options: {
    highWaterMark?: number;
    rangeSize?: number;
    headers?: Record<string, string>;
  },
  callback: (err?: unknown) => void,
) => {
  const rangeSize = options.rangeSize ?? 4 * 1024 * 1024;
  const highWaterMark = options.highWaterMark ?? 4 * 1024 * 1024;
  if (range) {
    sendFileRange(
      res,
      path,
      range,
      {
        highWaterMark,
        rangeSize,
        headers: options.headers,
      },
      callback,
    );
  } else {
    sendFullFile(
      res,
      path,
      {
        highWaterMark,
        headers: options.headers,
      },
      callback,
    );
  }
};
