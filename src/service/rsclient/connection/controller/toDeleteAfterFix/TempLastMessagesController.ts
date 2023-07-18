import { Message } from "@/types/Message"
import { RequestResponse } from "../../Connection"

export default class TempLastMessagesController extends RequestResponse<{}, {
    messages: Message[]
}> {
    protected readonly route = 'tempMethodLastMessages'
}