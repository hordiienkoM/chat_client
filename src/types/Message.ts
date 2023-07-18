export interface Message {
    id: string;
    userId: string;
    username: string;
    creationDateTime: string;
    topic: string;
    text: string;
    edited: boolean;
    editDateTime?: Date;
  }