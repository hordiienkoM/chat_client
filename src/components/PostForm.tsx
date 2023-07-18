import { Component, Vue, TSX, Prop } from 'vue-facing-decorator';
import RSocketConnector from '@/service/RSocketConnector';

interface Props {
  connector: RSocketConnector;
}

@Component
export default class PostForm extends TSX<Props>()(Vue) {
  private topic: string = ''
  private text: string = '';
  @Prop({
    required: true
  })
  private connector!: RSocketConnector;
  

  private publishPost() {
    this.connector.postMessage(this.topic, this.text);
    this.topic = '';
    this.text = '';
  }

  public render() {
    return (
      <div>
        <style>
          {`
            .topic-pf {
              width: 100%;
              border: 2px solid #e1ccb8;
              box-sizing: border-box;
              height: 40px
            }
            .textarea-pf {
              width: 100%;
              height: 100px;
              border: 1px solid #e1ccb8;
              resize: none;
              outline: none;
              box-sizing: border-box;
            }

            .button-box {
              display: flex;
              justify-content: flex-end;
            }
      
            .button-pf {
              border: 2px solid gray;
              padding: 10px;
            }
          `}
        </style>
        <div class="post-form-container">
        <div>
          <input
            class="topic-pf"
            placeholder="topic"
            v-model={this.topic}
            type="text"
          />
        </div>

          <div>
            <textarea 
            class="textarea-pf" 
            v-model={this.text}
            placeholder="your message"/>
          </div>

          <div class="button-box">
            <button class="button-pf" onClick={this.publishPost}>Publish</button>
          </div>
        </div>
      
    </div>
    );
  } 
}
