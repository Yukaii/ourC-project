import { Lexer, TokenType, Token, Parser, NodeType, Node } from './index';
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
})
