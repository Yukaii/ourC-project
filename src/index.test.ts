import { Lexer, TokenType, Token } from './index';
import test from 'ava';

test('Lexer', t => {
  t.deepEqual(Lexer.lex('a > -5;'), [
    new Token(TokenType.ID, 'a'),
    new Token(TokenType.GT),
    new Token(TokenType.MINUS),
    new Token(TokenType.NUM, 5),
    new Token(TokenType.SEMI)
  ]);

  t.deepEqual(Lexer.lex('2+3;'), [
    new Token(TokenType.NUM, 2),
    new Token(TokenType.PLUS),
    new Token(TokenType.NUM, 3),
    new Token(TokenType.SEMI)
  ]);

  t.deepEqual(Lexer.lex('1+1 ;// here the line comment'), [
    new Token(TokenType.NUM, 1),
    new Token(TokenType.PLUS),
    new Token(TokenType.NUM, 1),
    new Token(TokenType.SEMI),
    new Token(TokenType.COMMENT, 'here the line comment')
  ])
});
