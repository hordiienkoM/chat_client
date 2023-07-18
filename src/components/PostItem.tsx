import { TSX, Prop, Component, Vue } from 'vue-facing-decorator';
import { Message } from '../types/Message';
import RSocketConnector from '@/service/RSocketConnector';

interface Props {
  message: Message;
  connector: RSocketConnector;
}

@Component
export default class PostItem extends TSX<Props>()(Vue) {
  @Prop({
    required: true
  })
  private readonly message!: Message;
  @Prop({
    required: true
  })
  private connector!: RSocketConnector;
  private isEditing = false;
  private editedTitle = '';
  private editedText = '';

  private formatDateTime(dateTime: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    return new Intl.DateTimeFormat('en-US', options).format(dateTime);
  }

  private startEditing() {
    this.isEditing = true;
    this.editedTitle = this.message.topic;
    this.editedText = this.message.text;
  }

  private saveChanges() {
    const { id } = this.message;
    const { editedTitle, editedText } = this;

    this.connector.changeMessage(id, editedTitle, editedText).then(() => {
      this.isEditing = false;
      this.message.topic = editedTitle;
      this.message.text = editedText;
    });
  }

  private get canEdit(): boolean {
    return this.connector.username === this.message.username;
  }

  public render() {
    return (
      <div>
        <style>
          {`
            .message-container {
              overscroll-behavior-x: none;
              border: 3px solid gray;
              padding: 10px;
              margin-top: 20px;
            }
            .post-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid gray;
              padding-bottom: 10px;
              margin-bottom: 10px;
              flex-direction: column;
            }
            .post-author {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
              text-align: right;
              color: brown;
            }
            .post-username {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
              text-align: left;
            }
            .post-topic {
              font-size: 14px;
              margin-bottom: 5px;
              color: sandybrown;
            }
            .post-content {
              margin-bottom: 10px;
            }
            .post-footer {
              border-top: 1px solid gray;
              padding-top: 10px;
              font-size: 12px;
              color: gray;
            }
            .edit-button {
              border: 2px solid gray;
              padding: 10px;
            }
            .edit-button-box {
              text-align: right;
            }
          `}
        </style>
        <div class="message-container">
            <div class="post-header">
              <div>
                {this.connector.username === this.message.username ?
                    (<div class="post-author">{this.message.username}</div>)
                    : (<div class="post-username">{this.message.username}</div>)
                }
              </div>
                <div class="post-topic">{"topic: " + this.message.topic}</div>
            </div>

            <div class="post-content">
                <p>{this.message.text}</p>
            </div>

            <div class="post-footer">
              {this.message.edited ? (
                <p>Edited: {this.message.editDateTime!}</p>
              ) : (
                <p>Created: {this.message.creationDateTime}</p>
              )}

              {this.isEditing ? (
                <div>
                  <div>
                    <input v-model={this.editedTitle} type="text" />
                  </div>
                  <div>
                    <textarea v-model={this.editedText}></textarea>
                  </div>
                  <div>
                    <button onClick={this.saveChanges}>Save Changes</button>
                  </div>
                </div>
              ) : (
                <div>
                  {this.canEdit && (
                    <div class="edit-button-box">
                      <button class="edit-button" onClick={this.startEditing}>Edit</button>
                    </div>
                  )}
                </div>
              )}

            </div>
            
        </div>
      </div>
    );
  }
}


