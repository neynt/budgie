export interface MessageLine {
  type: string;
  text: string;
}

export interface ComplexMessage {
  lines: Array<MessageLine>;
}

export interface SimpleMessage {
  lines: Array<string>;
}

export interface PasswordMessage {
  enable: boolean;
}
