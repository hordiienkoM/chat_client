import {RequestChannel} from "../Connection";
import {Buffer} from "buffer";

export default class UploadImageController extends RequestChannel<{
    upload: Buffer,
}, {
    status: boolean
}> {
    protected readonly route = 'uploadImage'
}