const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function start(api) {
  process.stdout.write(">>> ");
  rl.on('line', (input) => {
    console.log(`ShellC Received: ${input}`);
    process.stdout.write(">>> ");
  });
}

module.exports = {
  start: start
}
