import { HttpResponse } from 'uWebSockets.js';

export const sendNotFound = (res: HttpResponse) => {
  if (res.aborted) {
    return;
  }
  res.cork(() => {
    res.writeStatus('404');
    res.end();
  });
};

export const sendInternalServerError = (res: HttpResponse) => {
  if (res.aborted) {
    return;
  }
  res.cork(() => {
    res.writeStatus('500');
    res.end();
  });
};

export const sendHeaders = (
  res: HttpResponse,
  headers: Record<string, string>,
): void => {
  for (const [key, value] of Object.entries(headers)) {
    res.writeHeader(key, value);
  }
};
