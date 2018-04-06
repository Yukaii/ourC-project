export enum TokenType {
  QUIT = 'QUIT',
  ID = 'ID',
  ASSIGN = 'ASSIGN', // :=
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  TIMES = 'TIMES', // *
  DIVIDE = 'DIVIDE', // /
  EQ = 'EQ', // =
  NEQ = 'NEQ', // <>
  GE = 'GE', // >=
  LE = 'LE', // <=
  LT = 'LT', // <
  GT = 'GT', // >
  NUM = 'NUM',
}

export const RULES : Map<TokenType, RegExp> = new Map([
  [TokenType.QUIT, /^quit/i], // case insensitive,
  [TokenType.ID, /^[a-zA-Z][a-zA-Z0-9_]*/],
  [TokenType.NUM, /^[+-]?([0-9]*[.])?[0-9]+/],
  [TokenType.ASSIGN, /^:=/],
  [TokenType.PLUS, /^\+/ ],
  [TokenType.MINUS, /^-/],
  [TokenType.TIMES, /^\*/],
  [TokenType.DIVIDE, /^\\/],
  [TokenType.EQ, /^\=/],
  [TokenType.NEQ, /^<>/],
  [TokenType.GE, /^>=/],
  [TokenType.LE, /^<=/],
  [TokenType.LT, /^</],
  [TokenType.GT, /^>/],
])

export class Token {
  constructor (
    public readonly type : TokenType,
    public readonly value? : any,
  ) {}

  toString () {
    return `Token<${this.type}${this.value ? '' : `, ${this.value}`}>`
  }
}

export class Lexer {
  private offset = 0;
  private buf = '';

  constructor (
    private rules : Map<TokenType, RegExp>
  ) { }

  skipWhiteSpace () : void {
    const m = this.restBuf.match(/^\s+/);

    if (!!m) {
      this.offset += m[0].length;
    }
  }

  get restBuf () : string {
    return this.buf.slice(this.offset);
  }

  lex (buf : string) {
    this.offset = 0;
    this.buf = buf;

    const tokens : Token[] = [];

    while (this.offset < this.buf.length) {
      this.skipWhiteSpace();

      let match;

      for (let [tokenType, rule] of this.rules) {
        const m = this.restBuf.match(rule);
        let value
        match = !!m;

        // matched!
        if (match) {
          let rawString = m![0];
          this.offset += rawString.length;

          switch(tokenType) {
            case TokenType.NUM:
              value = rawString.includes('.') ? parseFloat(rawString) : parseInt(rawString);
              break;
            case TokenType.ID:
              value = rawString;
              break;
            default:
              break;
          }

          tokens.push(new Token(
            tokenType,
            value
          ));

          break;
        } else {
          // no match
        }
      }

      if (!match) {
        break;
      }
    }

    return tokens;
  }
}
