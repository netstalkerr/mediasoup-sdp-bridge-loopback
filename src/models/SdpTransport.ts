import {
    Producer,
    Consumer,
} from 'mediasoup/lib/types';
import { SdpEndpoint } from 'mediasoup-sdp-bridge';

export interface SdpTransportDictionary {
    [path: string]: SdpTransport;
}

export interface SdpTransport {
    sdpEndpoint: SdpEndpoint;
    producers: Producer[];
    consumers: Consumer[];
}