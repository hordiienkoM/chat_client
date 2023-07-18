import { TSX, Prop, Component, Vue } from 'vue-facing-decorator';
import { Message } from '../types/Message';
import PostItem from './PostItem';
import PostForm from './PostForm';
import RSocketConnector from '@/service/RSocketConnector';
import { parseISO } from 'date-fns';

interface Props {
  messages: Map<string, Message>;
  connector: RSocketConnector;
}

@Component({
  components: {
    PostItem,
    PostForm
  }
})
export default class PostList extends TSX<Props>()(Vue) {
  @Prop({
    required: true
  })
  public readonly messages!: Map<String, Message>;
  @Prop({
    required: true
  })
  public connector!: RSocketConnector;
  
  private dateCompare (dateString1: string, dateString2: string) {
    const date1 = parseISO(dateString1);
    const date2 = parseISO(dateString2);
    return date1.getTime() - date2.getTime();
  }

  public render() {
    return (
      <div>
        <style>
          {`
            .post-container {
              height: 150px;
              position: sticky;
              bottom: 0;
              padding: 10px;
              border-top: 3px solid orange;
              padding-top: 10px;
              margin-top: 20px;
              width: 100%;
            }
            .post-list {
              width: 100%;
              height: calc(100vh - 200px);
              overflow-y: auto;
              overflow-x:hidden;
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 165, 0, 0.5) transparent;
              overflow: auto;
            }
            .post-list-container {
              width: 100%;
              padding-right: 10px;
            }
          `}
        </style>
        <div class="post-list">
          <div class="post-list-container">
          {Array.from(this.messages.values())
            .sort((a, b) => this.dateCompare(a.creationDateTime, b.creationDateTime))
            .map((message) => (
              <PostItem message={message} connector={this.connector} key={message.id} />
            ))}
          </div>
        </div>
        <div class="post-container">
            {this.connector.isAuthenticated ? (
              <PostForm connector={this.connector}/>) : (
                <div>Сообщения могут оставлять только зарегистрированные пользователи</div>)
            }
          </div>
      </div>
    );
  }
}

