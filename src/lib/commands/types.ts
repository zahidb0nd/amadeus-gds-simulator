export type CommandResult = {
  ok: boolean;
  command: string;
  echo: string;
  output: string;
};

export type CommandHandlerContext = {
  rawInput: string;
  normalizedInput: string;
  sessionId: string;
};

export type CommandHandler = {
  name: string;
  match: (input: string) => boolean;
  execute: (context: CommandHandlerContext) => CommandResult | Promise<CommandResult>;
};