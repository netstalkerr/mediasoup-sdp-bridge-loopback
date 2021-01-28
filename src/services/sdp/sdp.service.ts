import os from 'os';
import config from '../../../config.json';
import { createWorker } from 'mediasoup';
import {
    Worker,
    Router,
    WebRtcTransport,
    Producer,
    Consumer,
    WorkerLogLevel,
    WorkerLogTag,
    RtpCodecCapability,
} from 'mediasoup/lib/types';
import {
    createSdpEndpoint,
    generateRtpCapabilities0,
    SdpEndpoint,
} from 'mediasoup-sdp-bridge';
import { ConnectionDictionary } from '../../models/Connection';
import { SdpTransport } from '../../models/SdpTransport';

let router: Router;
let connections: ConnectionDictionary = {};

export async function initialize() {
    let cpus: number = Object.keys(os.cpus()).length;
    let worker: Worker = await createWorker({
        logLevel: config.mediasoup.worker.logLevel as WorkerLogLevel,
        logTags: config.mediasoup.worker.logTags as WorkerLogTag[],
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });
    router = await worker.createRouter({ mediaCodecs: config.mediasoup.router.mediaCodecs as RtpCodecCapability[] });
}

export async function produce(id: string, offer: string) {
    if (connections[id]) {
        return;
    }

    let transport: WebRtcTransport = await router.createWebRtcTransport({
        listenIps: config.mediasoup.webRtcTransport.listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        enableSctp: true,
    });
    let sdpEndpoint: SdpEndpoint = createSdpEndpoint(transport, generateRtpCapabilities0());
    let producers: Producer[] = await sdpEndpoint.processOffer(offer);
    let answer: string = sdpEndpoint.createAnswer();

    connections[id] = {
        sdpTransports: {
            [id]: {
                sdpEndpoint,
                consumers: [],
                producers: producers,
            }
        }
    };

    return { type: 'answer', sdp: answer };
}

export async function consume(id: string, producerId: string) {
    let producerSdpTransport: SdpTransport = connections[producerId]?.sdpTransports[producerId];
    if (!producerSdpTransport || !producerSdpTransport.producers.length) {
        return;
    }

    let transport: WebRtcTransport = await router.createWebRtcTransport({
        listenIps: config.mediasoup.webRtcTransport.listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        enableSctp: true,
    });
    let sdpEndpoint: SdpEndpoint = createSdpEndpoint(transport, generateRtpCapabilities0());
    let consumerSdpTransport: SdpTransport = {
        sdpEndpoint,
        consumers: [],
        producers: [],
    };

    for (const producer of producerSdpTransport.producers) {
        let consumer: Consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities: generateRtpCapabilities0(),
            paused: true,
        });
        sdpEndpoint.addConsumer(consumer);
        consumerSdpTransport.consumers.push(consumer);
    }

    connections[id] = {
        sdpTransports: {
            ...connections[id]?.sdpTransports,
            [producerId]: consumerSdpTransport,
        }
    };

    return { type: 'offer', sdp: sdpEndpoint.createOffer() };
}

export async function processConsume(id: string, producerId: string, answer: string) {
    let consumerSdpTransport: SdpTransport = connections[id]?.sdpTransports[producerId];
    if (!consumerSdpTransport || !consumerSdpTransport.consumers.length) {
        return;
    }

    await consumerSdpTransport.sdpEndpoint.processAnswer(answer);
    for (const consumer of consumerSdpTransport.consumers) {
        consumer.resume();
    }
}