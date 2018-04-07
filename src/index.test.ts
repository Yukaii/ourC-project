import { Lexer, TokenType, Token, Parser, NodeType, Node, Intepreter } from './index';
import * as util from 'util';
import test from 'ava';

function log (object : any) {
  console.log(util.inspect(object, true, null!));
}

function scan (src : string) {
  return Lexer.scan(src);
}

function parse (src : string) {
  return Parser.parse(scan(src));
}

function inteprete (src : string) {
  return Intepreter.visit(parse(src));
}

test('Lexer', t => {
  t.deepEqual(Lexer.scan('a > -5;'), [
    new Token(TokenType.ID, 'a'),
    new Token(TokenType.GT),
    new Token(TokenType.MINUS),
    new Token(TokenType.NUM, 5),
    new Token(TokenType.SEMI)
  ]);

  t.deepEqual(Lexer.scan('2+3;'), [
    new Token(TokenType.NUM, 2),
    new Token(TokenType.PLUS),
    new Token(TokenType.NUM, 3),
    new Token(TokenType.SEMI)
  ]);

  t.deepEqual(Lexer.scan('1 + 5 * 3;'), [
    new Token(TokenType.NUM, 1),
    new Token(TokenType.PLUS),
    new Token(TokenType.NUM, 5),
    new Token(TokenType.MULTIPLY),
    new Token(TokenType.NUM, 3),
    new Token(TokenType.SEMI)
  ]);

  t.deepEqual(Lexer.scan('1+1 ;// here the line comment'), [
    new Token(TokenType.NUM, 1),
    new Token(TokenType.PLUS),
    new Token(TokenType.NUM, 1),
    new Token(TokenType.SEMI),
    new Token(TokenType.COMMENT, 'here the line comment')
  ]);

  t.deepEqual(Lexer.scan(`2   +3 // a line-comment here ; useless "input" here : 5+8;
  ; // another line-comment ;;; ('5+8;' and ';;;' should be ignored)`), [
    new Token(TokenType.NUM, 2),
    new Token(TokenType.PLUS),
    new Token(TokenType.NUM, 3),
    new Token(TokenType.COMMENT, 'a line-comment here ; useless "input" here : 5+8;'),
    new Token(TokenType.SEMI),
    new Token(TokenType.COMMENT, `another line-comment ;;; ('5+8;' and ';;;' should be ignored)`)
  ]);

  t.deepEqual(Lexer.scan('( 3 - 500 / 10 ) > 100 ;'), [
    new Token(TokenType.LPARAN),
    new Token(TokenType.NUM, 3),
    new Token(TokenType.MINUS),
    new Token(TokenType.NUM, 500),
    new Token(TokenType.DIVIDE),
    new Token(TokenType.NUM, 10),
    new Token(TokenType.RPARAN),
    new Token(TokenType.GT),
    new Token(TokenType.NUM, 100),
    new Token(TokenType.SEMI)
  ])
});

test('Invalid float number', t => {
  const error = t.throws(() => scan('3 + 345.3435.345'), TypeError);

  t.is(error.message, 'Invalid number format');
})

test('Parse', t => {
  t.deepEqual(parse('a := 1 + -5;'),
    new Node(
      NodeType.ASSIGN,
      undefined,
      new Node(NodeType.ID, new Token(TokenType.ID, 'a')), // left: symbol node
      new Node(NodeType.ADD, undefined,
        new Node(NodeType.INTEGER, new Token(TokenType.NUM, 1)),
        new Node(NodeType.INTEGER, new Token(TokenType.NUM, -5))
      )
    )
  );

  t.deepEqual(parse('2+3;'),
    new Node(
      NodeType.ADD,
      undefined,
      new Node(NodeType.INTEGER, new Token(TokenType.NUM, 2)),
      new Node(NodeType.INTEGER, new Token(TokenType.NUM, 3))
    )
  )

  t.deepEqual(parse('1 + 5 * 3;'),
    new Node(
      NodeType.ADD,
      undefined,
      new Node(NodeType.INTEGER, new Token(TokenType.NUM, 1)),
      new Node(
        NodeType.MULTIPLY,
        undefined,
        new Node(NodeType.INTEGER, new Token(TokenType.NUM, 5)),
        new Node(NodeType.INTEGER, new Token(TokenType.NUM, 3)),
      )
    )
  );

  t.deepEqual(parse('( 3 - 500 / 10 ) > 100 ;'),
    new Node(
      NodeType.GT,
      undefined,
      new Node(
        NodeType.SUB,
        undefined,
        new Node(NodeType.INTEGER, new Token(TokenType.NUM, 3)),
        new Node(
          NodeType.DIVIDE,
          undefined,
          new Node(NodeType.INTEGER, new Token(TokenType.NUM, 500)),
          new Node(NodeType.INTEGER, new Token(TokenType.NUM, 10)),
        )
      ),
      new Node(NodeType.INTEGER, new Token(TokenType.NUM, 100)),
    )
  )
})

test('Test Intepreter', t => {
  t.deepEqual(inteprete('1 + 3;'), 4);
  t.deepEqual(inteprete('a := 1 + 3;'), 4);

  t.deepEqual(inteprete('abc := ( 20 * 5 ) + 1 ;'), 101);
  t.deepEqual(inteprete('abc * 2 ;'), 202);

  t.deepEqual(inteprete(' bcd := 1;'), 1);
  t.deepEqual(inteprete('bcd := bcd + 10 ;'), 11);

  t.deepEqual(inteprete('e := bcd;'), 11);
  t.deepEqual(inteprete('e := e + 3 ;'), 14);

  t.deepEqual(inteprete('e > bcd ;'), true);
  t.deepEqual(inteprete('e < bcd ;'), false);
})
