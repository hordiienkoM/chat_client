import { TSX, Component, Vue, Prop, Emit } from 'vue-facing-decorator';
import RSocketConnector from '@/service/RSocketConnector';

interface Props {
  connector: RSocketConnector
}

@Component({
  emits: ['login', 'logout']
})
export default class LoginButton extends TSX<Props>()(Vue) {
  @Prop({
    required: true
  })
  private connector!: RSocketConnector;

  private username: string = '';
  private password: string = '';
  private showLoginForm = false;

  private login() {
    this.connector.login(this.username, this.password);
    this.$emit('login', this.username);
    this.username = '';
    this.password = '';
  }

  private logout() {
    this.showLoginForm = false;
    this.username = '';
    this.password = '';
    this.$emit('logout');
  }

  public render() {
    return (
      <div>
        <style>
          {`
            .button-lf {
              border: 2px solid gray;
              padding: 10px;
            }
          `}
        </style>
      {!this.connector.isAuthenticated ? (
        <div>
          {!this.showLoginForm ? (
            <button class="button-lf" onClick={() => this.showLoginForm = true}>Login</button>
          ) : (
            <div>
              <div>
                <input v-model={this.username} placeholder="Username" type="text" />
              </div>

              <div>
                <input v-model={this.password} placeholder="Password" type="password" />
              </div>

              <div>
                <button class="button-lf" onClick={this.login}>Login</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div>
            <button class="button-lf" onClick={this.logout}>logout</button>
          </div>
        </div>
      )}
    </div>
    );
  }
}
