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
  [TokenType.DIVIDE, /^\//],
  [TokenType.EQ, /^\=/],
  [TokenType.NEQ, /^<>/],
  [TokenType.GE, /^>=/],
  [TokenType.LE, /^<=/],
  [TokenType.LT, /^</],
  [TokenType.GT, /^>/],
  [TokenType.LPARAN, /^\(/],
  [TokenType.RPARAN, /^\)/],
  [TokenType.NUM, /^([0-9]*[.])?[0-9]+/],
]);

export class Token {
  constructor (
    public readonly type : TokenType,
    public value? : any,
  ) {}

  public toString () {
    return `Token<${this.type}${this.value ? '' : `, ${this.value}`}>`;
  }

  toJSON () {
    return {
      type: this.type,
      value: this.value
    };
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

  peekChar () {
    return this.src[this.offset];
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
        let value;
        match = !!m;

        // matched!
        if (match) {
          let rawString = m![0];
          this.offset += rawString.length;

          switch(tokenType) {
            case TokenType.NUM:
              const isFloat = rawString.includes('.');
              value = isFloat ? parseFloat(rawString) : parseInt(rawString);

              if (isFloat) {
                if (this.peekChar() && !this.peekChar().match(/\s/)) {
                  throw new TypeError('Invalid number format');
                }
              }

              break;
            case TokenType.ID:
              value = rawString;
              break;
            case TokenType.COMMENT:
              value = rawString.match(this.rules.get(tokenType) as RegExp)![1].trim();
              break;
            case TokenType.BOOL:
              value = rawString === 'true';
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
        // no token were match
        throw new TypeError(`<${this.buffer}> Invalid token`);
      }
    }

    return tokens;
  }
}(RULES);

export enum NodeType {
  ID = 'ID',
  ASSIGN = 'ASSIGN',
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  BOOL = 'BOOL',
  NEGATE = 'NEGATE',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  ADD = 'ADD',
  SUB = 'SUB',
  LT = 'LT',
  LE = 'LE',
  GT = 'GT',
  GE = 'GE',
  NEQ = 'NEQ',
  EQ = 'EQ',
  COMMAND = 'COMMAND',
}

export class Node {
  constructor (
    public nodeType : NodeType,
    public value? : Node | Token,
    public left? : Node,
    public right? : Node
  ) { }

  static makeLeaf (nodeType : NodeType, node : Node) {
    return new Node(nodeType, node);
  }

  toString () {
    return `${this.nodeType}, ${this.value}, ${this.left}, ${this.right}`;
  }
}

export const Parser = new class {
  private tokens : Token[] = [];
  private cursor = 0;
  private trace = false;

  constructor () { }

  parse (tokens : Token[], trace = false)  {
    this.trace = trace;
    this.cursor = 0;
    this.tokens = tokens;

    const ast = this.Command();

    return ast;
  }

  /**
   * <Command> ::= ID ( ':=' <ArithExp> | <IDlessArithExpOrBexp> ) ';'
   *             | <NOT_IDStartArithExpOrBexp> ';'
   *             | QUIT
   */
  Command () : Node {
    if (this.match(TokenType.ID)) {
      const id = this.previous();
      let expression = new Node(NodeType.ID, id);

      if (this.match(TokenType.ASSIGN)) {
        const exp = this.ArithExp();
        expression = new Node(NodeType.ASSIGN, undefined, expression, exp);
      } else {
        expression = this.IDlessArithExpOrBexp(expression);
      }

      this.consume(TokenType.SEMI, 'Semicolon required.');
      return expression;
    } else {
      this.traceLog('Command: call NOT_ID_StartArithExpOrBexp');
      const exp = this.NOT_ID_StartArithExpOrBexp();
      this.consume(TokenType.SEMI, 'Semicolon required.');

      if (exp) { return exp; }

      return this.quit(); // TODO: or error
    }
  }

  /**
   * IDlessArithExpOrBexp ::= { '+' <Term> | '-' <Term> | '*' <Factor> | '/' <Factor>}
   *                          [ <BooleanOperator> <ArithExp> ]
   */
  IDlessArithExpOrBexp (exp : Node) : Node {
    let expression = exp;

    while (this.match(TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const op = this.previous();

      let nodeType, isTerm;
      switch (op.type) {
        case TokenType.PLUS:
          nodeType = NodeType.ADD;
          isTerm = true;
          break;
        case TokenType.MINUS:
          nodeType = NodeType.SUB;
          isTerm = true;
          break;
        case TokenType.MULTIPLY:
          nodeType = NodeType.MULTIPLY;
          isTerm = false;
          break;
        case TokenType.DIVIDE:
          nodeType = NodeType.DIVIDE;
          isTerm = false;
          break;
        default:
          throw new TypeError('INVALID TOKEN TYPE HHHHHHH');
      }

      expression = new Node(nodeType, undefined, expression, isTerm ? this.Term() : this.Factor());
    }

    let boolOp = this.BooleanOprator();
    if (boolOp) {
      const exp = this.ArithExp();
      expression = new Node(boolOp.nodeType, undefined, expression, exp);
    }

    return expression as Node;
  }

  /**
   * <BooleanOprator> ::= '=' | '<>' | '>' | '<' | '>=' | '<='
   */
  BooleanOprator () : Node {
    let expression;

    if (this.match(TokenType.EQ, TokenType.NEQ, TokenType.GT, TokenType.GE, TokenType.LT, TokenType.LE)) {
      const cmp = this.previous();

      let nodeType;
      switch(cmp.type) {
        case TokenType.EQ:
          nodeType = NodeType.EQ;
          break;
        case TokenType.NEQ:
          nodeType = NodeType.NEQ;
          break;
        case TokenType.GT:
          nodeType = NodeType.GT;
          break;
        case TokenType.GE:
          nodeType = NodeType.GE;
          break;
        case TokenType.LT:
          nodeType = NodeType.LT;
          break;
        case TokenType.LE:
          nodeType = NodeType.LE;
          break;
        default:
          throw new TypeError('Invalid tokenType cmp');
      }

      expression = new Node(nodeType);
    }

    return expression as Node;
  }

  /**
   * <NOT_ID_StartArithExpOrBexp> ::= <NOT_ID_StartArithExp>
   *                               [ <BooleanOperator> <ArithExp> ]
   */
  NOT_ID_StartArithExpOrBexp () : Node {
    this.traceLog('NOT_ID_StartArithExpOrBexp');
    let expression = this.NOT_ID_StartArithExp();

    let boolOp = this.BooleanOprator();
    if (boolOp) {
      const exp = this.ArithExp();
      expression = new Node(boolOp.nodeType, undefined, expression, exp);
    }

    return expression;
  }

  /**
   * <NOT_ID_StartArithExp> ::= <NOT_ID_StartTerm> { '+' <Term> | '-' <Term> }
   */
  NOT_ID_StartArithExp () : Node {
    this.traceLog('NOT_ID_StartArithExp');
    let expression = this.NOT_ID_StartTerm();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const token = this.previous();
      expression = new Node(
        token.type === TokenType.PLUS ? NodeType.ADD : NodeType.SUB,
        undefined, expression, this.Term()
      );
    }

    return expression;
  }

  /**
   * <NOT_ID_StartTerm> ::= <NOT_ID_StartFactor> { '*' <Factor> | '/' <Factor> }
   */
  NOT_ID_StartTerm () : Node {
    this.traceLog('NOT_ID_StartTerm');
    let expression = this.NOT_ID_StartFactor();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const token = this.previous();

      expression = new Node(
        token.type === TokenType.MULTIPLY ? NodeType.MULTIPLY : NodeType.DIVIDE,
        undefined, expression, this.Factor()
      );
    }

    return expression;
  }

  /**
   * <NOT_ID_StartFactor> ::= [ SIGN ] NUM | '(' <ArithExp> ')'
   */
  NOT_ID_StartFactor () : Node {
    this.traceLog('NOT_ID_StartFactor');
    if (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const sign = this.previous();

      this.consume(TokenType.NUM, 'Number expected after sign');
      const number = this.previous();
      return new Node(Number.isInteger(number.value) ? NodeType.INTEGER : NodeType.FLOAT, number);
    } else if (this.match(TokenType.NUM)) {
      const number = this.previous();
      return new Node(Number.isInteger(number.value) ? NodeType.INTEGER : NodeType.FLOAT, number);
    } else if (this.match(TokenType.LPARAN)) {
      const expression = this.ArithExp();
      this.consume(TokenType.RPARAN, 'Missing right paranthesis');
      return expression;
    } else {
      throw new TypeError('Invalid NOT_ID_StartFactor Factor');
    }
  }

  /**
   * ArithExp ::= <Term> { '+' <Term> | '-' <Term> }
   */
  ArithExp () : Node {
    let expression = this.Term();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const isAdd = this.previous().type === TokenType.PLUS;

      const exp = this.Term();

      if (!exp) {
        throw new TypeError('Missing Factor');
      }

      expression = new Node(isAdd ? NodeType.ADD : NodeType.SUB, undefined, expression, exp);
    }

    return expression;
  }

  /**
   * Term ::= <Factor> { '*' <Factor> | '/' <Factor> }
   */
  Term () : Node {
    this.traceLog('Term');
    let expression = this.Factor();

    this.traceLog(expression);

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
      const isMultiply = this.previous().type === TokenType.MULTIPLY;

      const exp = this.Factor();

      if (!exp) {
        throw new TypeError('Missing Factor');
      }

      expression = new Node(isMultiply ? NodeType.MULTIPLY : NodeType.DIVIDE, undefined, expression, exp);
    }

    return expression;
  }

  /**
   * Factor ::= IDENT | [ SIGN ] NUM | '(' <ArithExp> ')'
   */
  Factor () : Node {
    if (this.match(TokenType.ID)) {
      const id = this.previous();
      return new Node(NodeType.ID, id);
    } else if (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const sign = this.previous();
      this.consume(TokenType.NUM, 'Number expected');

      const number = this.previous();
      // deal with sign
      if (sign.type === TokenType.MINUS) {
        number.value = -number.value;
      }
      return new Node(Number.isInteger(number.value) ? NodeType.INTEGER : NodeType.FLOAT, number);
    } else if (this.match(TokenType.NUM)) {
      const number = this.previous();
      return new Node(Number.isInteger(number.value) ? NodeType.INTEGER : NodeType.FLOAT, number);
    } else if (this.match(TokenType.LPARAN)) {
      const expression = this.ArithExp();
      this.consume(TokenType.RPARAN, 'Missing right paranthesis');
      return expression;
    } else {
      throw new TypeError('Invalid Factor');
    }
  }

  quit () : Node {
    if (this.match(TokenType.QUIT)) {
      return new Node(NodeType.COMMAND, this.previous());
    } else {
      throw new TypeError('Parse Error quit');
    }
  }

  private consume (type : TokenType, message : string) : Token {
    if (this.check(type)) { return this.advance(); }

    throw new TypeError(`${this.peek()}: ${message}`);
  }

  private match (...tokenTypes : TokenType[]) {
    for (let type of tokenTypes) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private advance () : Token {
    if (!this.isAtEnd()) { this.cursor++; }
    return this.previous();
  }

  private traceLog (...args : any[]) {
    if (this.trace) {
      console.log(...arguments);
    }
  }

  private check (tokenType : TokenType) : boolean {
    if (this.isAtEnd()) { return false; }
    return this.peek().type === tokenType;
  }

  private peek () : Token {
    return this.tokens[this.cursor];
  }

  private previous () : Token {
    return this.tokens[this.cursor - 1];
  }

  private isAtEnd () {
    return this.cursor === this.tokens.length;
  }

}();

class SymbolTable {
  private store : { [identifier : string]: any  } = { };

  set (identifier : string, value : any) {
    this.store[identifier] = value;
    return value;
  }

  get (identifier : string) {
    return this.store[identifier];
  }
}

const TABLE = new SymbolTable();

export const Interpreter = new class {
  public inteprete (src : string) {
    const tokens = Lexer.scan(src);
    const ast = Parser.parse(tokens);

    return this.visit(ast);
  }

  get symbolTable () {
    return TABLE;
  }

  visit (node : Node) : any {
    let token;
    switch(node.nodeType) {
      // binary operations
      case NodeType.ADD:
        return this.visit(node.left as Node) + this.visit(node.right as Node);
      case NodeType.SUB:
        return this.visit(node.left as Node) - this.visit(node.right as Node);
      case NodeType.MULTIPLY:
        return this.visit(node.left as Node) * this.visit(node.right as Node);
      case NodeType.DIVIDE:
        return this.visit(node.left as Node) / this.visit(node.right as Node);

      // boolean binary operations
      case NodeType.EQ:
        return this.visit(node.left as Node) === this.visit(node.right as Node);
      case NodeType.GT:
        return this.visit(node.left as Node) > this.visit(node.right as Node);
      case NodeType.GE:
        return this.visit(node.left as Node) >= this.visit(node.right as Node);
      case NodeType.LT:
        return this.visit(node.left as Node) < this.visit(node.right as Node);
      case NodeType.LE:
        return this.visit(node.left as Node) <= this.visit(node.right as Node);
      case NodeType.NEQ:
        return this.visit(node.left as Node) !== this.visit(node.right as Node);

      // value node
      case NodeType.INTEGER:
      case NodeType.FLOAT:
        token = node.value as Token;
        return token.value;

      case NodeType.ASSIGN:
        const idNode = node.left as Node;
        token = idNode.value as Token;
        return TABLE.set(token.value, this.visit(node.right as Node));

      case NodeType.ID:
        token = node.value as Token;
        return TABLE.get(token.value);

      default:
        throw new TypeError(`${NodeType} type is not implemented`);
    }
  }
}();
