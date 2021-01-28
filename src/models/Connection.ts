import { SdpTransportDictionary } from './SdpTransport';

export interface ConnectionDictionary {
    [path: string]: Connection;
}

export interface Connection {
    sdpTransports: SdpTransportDictionary;
}