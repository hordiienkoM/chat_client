import {RequestResponse} from "../Connection";

export default class RegistrationController extends RequestResponse<{
    login: string,
    password: string
}, {
    token: string
}> {
    protected readonly route = 'registration'
}