import { App as uWebSocketsApp, SSLApp as uWebSocketsSSLApp } from 'uWebSockets.js';
import { App } from './app';
import { Kali, KaliOptions } from './types';

export const kali: Kali = <T = unknown>(options?: KaliOptions<T>) => {
    if (options?.ssl) {
        return new App(uWebSocketsSSLApp({
            ssl_ciphers: options.ssl.sslCiphers,
            ssl_prefer_low_memory_usage: options.ssl?.sslPreferLowMemoryUsage,
            ca_file_name: options.ssl.caFile,
            cert_file_name: options.ssl.certFile,
            passphrase: options.ssl.passphrase,
            key_file_name: options.ssl.keyFile,
            dh_params_file_name: options.ssl.dhParamsFile,
        }), options)
    }

    return new App<T>(uWebSocketsApp(), options)
}
