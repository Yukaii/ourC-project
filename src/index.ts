export enum TokenType {
  QUIT = 'QUIT',
  ID = 'ID',
  ASSIGN = 'ASSIGN', // :=
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  MULTIPLY = 'TIMES', // *
  DIVIDE = 'DIVIDE', // /
  EQ = 'EQ', // =
  NEQ = 'NEQ', // <>
  GE = 'GE', // >=
  LE = 'LE', // <=
  LT = 'LT', // <
  GT = 'GT', // >
  NUM = 'NUM',
  SEMI = 'SEMI',
  COMMENT = 'COMMENT',
  LPARAN = 'LPARAN',
  RPARAN = 'RPARAN',
  BOOL = 'BOOL'
}

const RULES : Map<TokenType, RegExp> = new Map([
  [TokenType.QUIT, /^quit/i], // case insensitive,
  [TokenType.BOOL, /^(true)|(false)/],
  [TokenType.ID, /^[a-zA-Z][a-zA-Z0-9_]*/],
  [TokenType.COMMENT, /^\/\/([^\r\n]+)/],
  [TokenType.ASSIGN, /^:=/],
  [TokenType.SEMI, /^;/],
  [TokenType.PLUS, /^\+/ ],
  [TokenType.MINUS, /^-/],
  [TokenType.MULTIPLY, /^\*/],
  [TokenType.DIVIDE, /^\\/],
  [TokenType.EQ, /^\=/],
  [TokenType.NEQ, /^<>/],
  [TokenType.GE, /^>=/],
  [TokenType.LE, /^<=/],
  [TokenType.LT, /^</],
  [TokenType.GT, /^>/],
  [TokenType.LPARAN, /^\(/],
  [TokenType.RPARAN, /^\)/],
  [TokenType.NUM, /^([0-9]*[.])?[0-9]+/],
])

export class Token {
  constructor (
    public readonly type : TokenType,
    public value? : any,
  ) {}

  public toString () {
    return `Token<${this.type}${this.value ? '' : `, ${this.value}`}>`
  }

  toJSON () {
    return {
      type: this.type,
      value: this.value
    }
  }
}

export const Lexer = new class {
  private offset = 0;
  private src = '';

  constructor (
    private rules : Map<TokenType, RegExp>
  ) { }

  skipWhiteSpace () : void {
    const m = this.buffer.match(/^\s+/);

    if (!!m) {
      this.offset += m[0].length;
    }
  }

  get buffer () : string {
    return this.src.slice(this.offset);
  }

  scan (src : string) {
    this.offset = 0;
    this.src = src;

    const tokens : Token[] = [];

    while (this.offset < this.src.length) {
      this.skipWhiteSpace();

      let match;

      for (let [tokenType, rule] of this.rules) {
        const m = this.buffer.match(rule);
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
            case TokenType.COMMENT:
              value = rawString.match(this.rules.get(tokenType) as RegExp)![1].trim();
              break;
            case TokenType.BOOL:
              value = rawString === 'true'
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
}(RULES);
}
