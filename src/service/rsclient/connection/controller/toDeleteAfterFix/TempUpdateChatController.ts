import { Message } from "@/types/Message"
import { RequestResponse } from "../../Connection"

export default class TempUpdateChatController extends RequestResponse<{
    lastMessageId: string;
}, {
    messages: Message[]
}> {
    protected readonly route = 'tempMethodUpdateChat'
}