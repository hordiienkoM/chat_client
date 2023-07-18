import { TSX, Component, Vue, Prop } from 'vue-facing-decorator';
import RSocketConnector from '@/service/RSocketConnector';
import Connection from '@/service/rsclient/connection/Connection';


interface Props {
  connector: RSocketConnector
}

@Component({
  emits: ['registration']
})
export default class Registration extends TSX<Props>()(Vue) {
  @Prop({
    required: true
  })
  private connector!: RSocketConnector;
  private username: string = '';
  private password: string = '';
  private confirmPassword: string = '';
  private showRegistrationForm: boolean = false;

  private registration() {
    this.$emit('registration', this.username, this.password, this.confirmPassword);
    this.showRegistrationForm = false;
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
  }

  public render() {
    return (
      <div>
        <style>
          {`
            .button-reg {
              border: 2px solid gray;
              padding: 10px;
            }
          `}
        </style>
        {!this.showRegistrationForm ? (
          <button class="button-reg" onClick={() => this.showRegistrationForm = true}>Registration</button>
        ) : (
          <div>
            <div>
              <input v-model={this.username} placeholder="Username" type="text" />
            </div>

            <div>
              <input v-model={this.password} placeholder="Password" type="password" />
            </div>

            <div>
              <input v-model={this.confirmPassword} placeholder="Confirm password" type="password" />
            </div>

            <div>
              <button class="button-reg" onClick={this.registration}>Registration</button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
