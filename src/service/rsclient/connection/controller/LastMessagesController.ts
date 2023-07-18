import {RequestStream} from "../Connection";
import { Message } from "@/types/Message";

export default class LastMessagesController extends RequestStream<{}, {
    message: Message
}> {
    protected readonly route = 'messages'
}

