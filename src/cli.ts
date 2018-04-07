import readline from 'readline';
import { Interpreter } from './index';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt () {
  rl.setPrompt('> ');
  rl.prompt();
}

function emptyPrompt () {
  rl.setPrompt('');
  rl.prompt();
}

function eol (line : string) {
  if (line.includes(';')) {
    if (line.includes('//')) {
      return line.indexOf(';') < line.indexOf('//')
    } else {
      return true;
    }
  } else {
    return false;
  }
}

let src = ''

rl.on('line', function(line : string) {
  src += line;
  if (eol(line)) {
    console.log(Interpreter.inteprete(src));
    src = ''
    prompt();
  } else if (line.trim() === 'quit') {
    rl.close();
  } else {
    emptyPrompt();
  }
}).on('close', function() {
  process.exit(0);
});

prompt();
