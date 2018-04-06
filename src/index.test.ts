import { Lexer, TokenType, Token } from './index';
import test from 'ava';

test('Lexer', t => {
  const tokens = Lexer.lex('a > -5')

  t.deepEqual(tokens, [
    new Token(TokenType.ID, 'a'),
    new Token(TokenType.GT),
    new Token(TokenType.NUM, -5)
  ]);
});
