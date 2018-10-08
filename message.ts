export interface MessageLine {
  type: string;
  text: string;
}

export interface ComplexMessage {
  lines: Array<MessageLine>;
}
