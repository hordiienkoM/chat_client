import {FireAndForget} from "../Connection";

export default class LogoutController extends FireAndForget<{}> {
    protected readonly route = 'logout'
}