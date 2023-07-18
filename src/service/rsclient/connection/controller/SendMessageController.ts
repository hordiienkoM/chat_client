import {RequestResponse} from "../Connection";

export default class SendMessageController extends RequestResponse<{
    tittle: string,
    text: string
}, {
    id: string
    tittle: string
    text: string
}> {
    protected readonly route = 'postMessage'
}