declare namespace Telegraf {
  interface Context {
    message?: {
      text?: string;
    };
    from?: {
      id: number;
      username?: string;
    };
    reply(text: string, options?: any): Promise<any>;
  }
}