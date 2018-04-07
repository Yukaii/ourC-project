import { Lexer, TokenType, Token, Parser, NodeType, Node } from './index';
import * as util from 'util';
import test from 'ava';

function log (object : any) {
  console.log(util.inspect(object, true, null!));
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
  ])
});

test.todo('// TODO: word boundary check, like 345.3435.345');

test('Parse', t => {
  const ast = Parser.parse(Lexer.scan('a := 1 + -5;'));

  t.deepEqual(ast,
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
})
