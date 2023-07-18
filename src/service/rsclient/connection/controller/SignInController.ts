import {RequestResponse} from "../Connection";

export default class SignInController extends RequestResponse<{
    login: string,
    password: string
}, {
    token: string
}> {
    protected readonly route = 'login'
}