import {RequestResponse} from "../Connection";

export default class ChangeMessageController extends RequestResponse<{
    id: string,
    tittle: string,
    text: string
}, {
    id: string
    tittle: string
    text: string
}> {
    protected readonly route = 'putMessage'
}