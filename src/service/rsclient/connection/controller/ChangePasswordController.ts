import {FireAndForget} from "../Connection";

export default class ChangePasswordController extends FireAndForget<{
    currentPassword: string,
    newPassword: string
}> {
    protected readonly route = "changePassword"
}