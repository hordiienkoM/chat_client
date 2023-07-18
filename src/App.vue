<template>
  <div class="app-background">
      <div class="app-container">
        <div class="sidebar">
            <Registration :connector="connector" @registration="handleRegistration"/>
            <LoginForm :connector="connector" @login="handleLogin" @logout="handleLogout"/>
        </div>
        
        <div class="main-content">
          <PostList :connector="connector" :messages="messages"/>
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';
import PostList from './components/PostList';
import { Message } from './types/Message';
import Registration from './components/Registration';
import LoginForm from './components/LoginForm';
import RSocketConnector from './service/RSocketConnector';
import { parseISO } from 'date-fns';

@Component({
  components: {
    PostList,
    Registration,
    LoginForm
  }
})
export default class App extends Vue {
  connector: RSocketConnector = new RSocketConnector();
  messages = new Map<string, Message>();
  lastMessage: Message | null = null;

  async mounted() {
    try {
      const newMessages = await this.connector.tempRealizationReadChat();
      newMessages.forEach(message => this.messages.set(message.id, message));
      this.lastMessage = await this.findLastMessage(newMessages);
      this.updateChatScheduller();
    } catch (error: any) {
      console.log(error);
    }
  }

  public handleLogin(username: string) {
    this.connector.username = username;
    console.log(username);
    this.connector.isAuthenticated = true;
  }

  public handleRegistration(username: string, password: string, confirmPassword: string) {
    this.connector.registration(username, password, confirmPassword)
  }

  public handleLogout() {
    this.connector.logout();
    this.connector.isAuthenticated = false;
    this.connector.username = '';
  }

  async updateChatScheduller() {
    setInterval(() => {
      if (this.lastMessage !== null) {
        this.updateChat(this.lastMessage.id)
      } else {
        this.connector.tempRealizationReadChat();
      }
  }, 3000);
  }

  async updateChat(lastMessageId: string) {
    const newMessages = await this.connector.tempRealizationUpdateChat(lastMessageId)
    this.lastMessage = await this.findLastMessage(newMessages);  
    newMessages.forEach((message) => {
    this.messages.set(message.id, message);
    });
  }

  async findLastMessage(newMessages: Set<Message>){
  if (newMessages.size > 0) {
    let newLastMessage: Message | null = null;
    let lastCreationDate: Date | null = null;
    if (this.lastMessage !== null) {
      newLastMessage = this.lastMessage;
      lastCreationDate = parseISO(newLastMessage.creationDateTime);
    }

    newMessages.forEach((message) => {
      const creationDate = parseISO(message.creationDateTime);
      if (!newLastMessage || creationDate > lastCreationDate!) {
        newLastMessage = message;
        lastCreationDate = creationDate;
      }
    });

    if (newLastMessage !== null) {
      return newLastMessage;
      }
    }
    return this.lastMessage;
  }
}
</script>
  
<style scoped>
  .app-background {
    background-color: orange;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .app-container {
    border: 2px solid orange;
    width: 1100px;
    background-color: #f7f7f7;
    display: flex;
  }

  .sidebar {
    display: flex;
    flex-wrap: wrap;
    background-color: #f7f7f7;
    padding: 20px;
    height: 100%;
    width: 20%;
    order: 2;
  }

  .sidebar > * {
    flex: 0 0 100%;
    margin-bottom: 10px;
  }

  @media screen and (min-width: 768px) {
    .sidebar > * {
      flex: 0 0 calc(10% - 10px);
      margin-bottom: 10;
      margin-right: 10px;
    }
  }

  .main-content {
    flex: 1;
    padding: 20px;
    background-color: white;
    height: 100vh;
    width: 75%;
    order: 1;
  }
</style>