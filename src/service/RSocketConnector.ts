import { RSOCKET_SERVER_URL } from "@/constants";
import Connection from "./rsclient/connection/Connection";
import SignInController from "./rsclient/connection/controller/SignInController";
import SendMessageController from "./rsclient/connection/controller/SendMessageController";
import LastMessagesController from "./rsclient/connection/controller/LastMessagesController";
import LogoutController from "./rsclient/connection/controller/LogoutController"
import ChangeMessageController from "./rsclient/connection/controller/ChangeMessageController"
import TempLastMessagesController from "./rsclient/connection/controller/toDeleteAfterFix/TempLastMessagesController";
import TempUpdateChatController from "./rsclient/connection/controller/toDeleteAfterFix/TempUpdateChatController";
import { Message } from "@/types/Message";
import RegistrationController from "./rsclient/connection/controller/RegistrationController";

export default class RSocketConnector {
    url: string = RSOCKET_SERVER_URL;
    WS = new Connection(this.url);
    isAuthenticated: boolean = false;
    username: string = '';

    async login(username: string, pass: string) {
        try {
            const response = await this.WS.process(SignInController, {
            login: username,
            password: pass
            });
            this.WS.setBearerAuthentication(response.token);
            this.isAuthenticated = true;
            this.username = username;
        } 
        catch (error: any) {
            if (error.response) {
            console.error('Ошибка при выполнении запроса:', JSON.stringify(error.response.data));
            } else if (error.message) {
            console.error('Ошибка при выполнении запроса:', error.message);
            } else {
            console.error('Ошибка при выполнении запроса:', JSON.stringify(error));
            }
        }
    }

    async logout() {
        await this.WS.process(LogoutController, {});
        this.WS.removeAuthentication();
        this.isAuthenticated = false;
    }

    async registration(username: string, pass: string, passConfirm: string) {
      try {
          if (pass !== passConfirm) {
            throw new Error('Пароли не совпадают');
          }
          const response = await this.WS.process(RegistrationController, {
          login: username,
          password: pass
          });
          this.WS.setBearerAuthentication(response.token);
          this.isAuthenticated = true;
          this.username = username;
      } 
      catch (error: any) {
          if (error.response) {
          console.error('Ошибка при выполнении запроса:', JSON.stringify(error.response.data));
          } else if (error.message) {
          console.error('Ошибка при выполнении запроса:', error.message);
          } else {
          console.error('Ошибка при выполнении запроса:', JSON.stringify(error));
          }
      }
  }

    async postMessage(tittle: string, text: string) {
        try {
          await this.WS.process(SendMessageController, {
          tittle: tittle,
          text: text,
          });
          console.log("message " + tittle + " sent successfully");
          
        } catch (error: any) {
            if (error.response) {
                console.error('Ошибка при выполнении запроса:', JSON.stringify(error.response.data));
              } else if (error.message) {
                console.error('Ошибка при выполнении запроса:', error.message);
              } else {
                console.error('Ошибка при выполнении запроса:', JSON.stringify(error));
              }
        }
    }

    async changeMessage(id: string, tittle: string, text: string) {
      try {
        await this.WS.process(ChangeMessageController, {
          id: id,
          tittle: tittle,
          text: text,
        });
        console.log("message " + tittle + " changed successfully");
        
      } catch (error: any) {
          if (error.response) {
              console.error('Ошибка при выполнении запроса:', JSON.stringify(error.response.data));
            } else if (error.message) {
              console.error('Ошибка при выполнении запроса:', error.message);
            } else {
              console.error('Ошибка при выполнении запроса:', JSON.stringify(error));
            }
      }
  }

    async readChat() {
      this.WS.process(LastMessagesController, {}, data => {
        if (data._error) throw new Error(data._error.message)
        if (data._isComplete) return// resubscribe
        console.log(data.message);
        data.message
      }).then(requester => requester.request(10000000));
    }

    async tempRealizationReadChat(): Promise<Set<Message>> {
      try {
        const response = await this.WS.process(TempLastMessagesController, {});
        console.log(response.messages);
        
        return new Set<Message>(response.messages);
        
      } catch (error: any) {
          if (error.response) {
              console.error('Ошибка при выполнении запроса:', JSON.stringify(error.response.data));
            } else if (error.message) {
              console.error('Ошибка при выполнении запроса:', error.message);
            } else {
              console.error('Ошибка при выполнении запроса:', JSON.stringify(error));
            }
          return new Set<Message>();
      }
    }

    async tempRealizationUpdateChat(lastMessageId: string): Promise<Set<Message>>  {
      try {
        const response = await this.WS.process(TempUpdateChatController, {
          lastMessageId: lastMessageId
        });
        console.log(response.messages);
        
        return new Set<Message>(response.messages);
        
      } catch (error: any) {
          if (error.response) {
              console.error('Ошибка при выполнении запроса:', JSON.stringify(error.response.data));
            } else if (error.message) {
              console.error('Ошибка при выполнении запроса:', error.message);
            } else {
              console.error('Ошибка при выполнении запроса:', JSON.stringify(error));
            }
            return new Set<Message>();
      }
    }
}