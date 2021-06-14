import * as readline from "readline";

async function inputFromUser(message: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise<string>((resolve, reject) => {
    rl.question(message + "> ", (answer: string) => {
      resolve(answer);
    });
  });
}

async function main(): Promise<void> {
  const a = await inputFromUser("test");
  console.log(a);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
void main().then(() => {
  rl.close();
});
