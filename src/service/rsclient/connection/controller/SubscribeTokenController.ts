import {RequestStream} from "../Connection";

export default class SubscribeTokenController extends RequestStream<null, {
    token: string
}> {
    protected readonly route = 'subscribeToken'
}