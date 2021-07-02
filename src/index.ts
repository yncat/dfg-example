import * as readline from "readline";
import * as dfg from "dfg-simulator";

// ゲーム中のイベントをコールバックで受け取るためのオブジェクト。
// dfg.EventReceiver インターフェイスを満たす必要がある。
class EventReceiver implements dfg.EventReceiver {
  playerNames: string[];
  playerIdentifiers: string[];
  idToNameMap: Map<string, string>;
  constructor(playerNames: string[], playerIdentifiers: string[]) {
    this.playerNames = playerNames;
    this.playerIdentifiers = playerIdentifiers;
    this.idToNameMap = new Map();
    this.buildMap();
  }
  private buildMap() {
    for (let i = 0; i < this.playerNames.length; i++) {
      this.idToNameMap.set(this.playerIdentifiers[i], this.playerNames[i]);
    }
  }
  public onNagare(): void {
    console.log("場のカードが流れました。");
  }
  public onAgari(): void {
    console.log("あがり!");
  }
  public onYagiri(): void {
    console.log("八切り!");
  }
  public onJBack(): void {
    console.log("Jバック!");
  }
  public onKakumei(): void {
    console.log("革命!");
  }
  public onStrengthInversion(strengthInverted: Boolean): void {
    const s = strengthInverted
      ? "カードの強さが逆になった!"
      : "カードの強さが元に戻った!";
    console.log(s);
  }
  public onDiscard(): void {
    console.log("カードを捨てた!");
  }
  public onPass(): void {
    console.log("パス。");
  }
  public onGameEnd(): void {
    console.log("ゲーム終了!");
  }
  public onPlayerKicked(): void {
    console.log("プレイヤーがゲームから抜けた!");
  }
  public onPlayerRankChanged(
    identifier: string,
    before: dfg.RankType,
    after: dfg.RankType
  ): void {
    console.log("ランクが変化した!");
  }
}

async function inputFromUser(message: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise<string>((resolve, reject) => {
    rl.question(message + "> ", (answer: string) => {
      resolve(answer);
    });
  });
}

async function inputNumberFromUser(
  message: string,
  min: number,
  max: number
): Promise<number> {
  let ret: number;
  while (true) {
    const s = await inputFromUser(message + "(" + min + " - " + max + ")");
    const n = parseInt(s);
    if (isNaN(n)) {
      console.log("数値を読み取れません。");
      continue;
    }
    if (n < min || n > max) {
      console.log("" + min + "から" + max + "の間で入力してください。");
      continue;
    }
    ret = n;
    break;
  }
  return ret;
}

async function main(): Promise<void> {
  const numPlayers = await inputNumberFromUser("プレイヤーの人数", 2, 20);
  console.log(numPlayers);
  const playerNames: string[] = [];
  for (let i = 0; i < numPlayers; i++) {
    const pn = i + 1;
    const pname = await inputFromUser(
      "プレイヤー" + pn + "の名前(省略時は p" + pn + ")"
    );
    const k = pname == "" ? "p" + pn : pname;
    playerNames.push(k);
  }

  // プレイヤー識別子を生成する
  // dfg-simulatorはプレイヤーの名前を直接扱わず、全て識別子で管理する。
  // 識別子は重複するといけないので、dfg-simulator側の関数で払い出してもらうことで、ユニーク性を保証できる。
  // 識別子と、実際のプレイヤー名のマッピングは、ライブラリ利用者が行う。
  const playerIdentifiers = dfg.generateUniqueIdentifiers(numPlayers);
  for (let i = 0; i < numPlayers; i++) {
    console.log(playerNames[i] + ": " + playerIdentifiers[i]);
  }

  // dfg-simulatorでのゲーム作成準備
  // まずは、ルール設定と、各種コールバックの設定が必要です。
  // ルール設定は、以下の関数で、全てオフの状態で取得します。
  const rc = dfg.createDefaultRuleConfig();
  // 必要なものをオンにします。
  rc.yagiri = true;
  rc.jBack = true;
  rc.kakumei = true;
  // 各種コールバックを登録します。所々で、プレイヤーの識別子と表示名のマッピングをする必要があるので、その部分はこちらで担保します。
  // コールバックを受け取る関数を1個のクラスにまとめて、 dfg.EventReceiver インターフェイスを満たすように作成しておきます。
  // EventReceiver を実装したオブジェクトを渡すことで、コールバックを登録します。
  const evt = new EventReceiver(playerNames, playerIdentifiers);
  // これでやっとゲームが作れます。
  const game = dfg.createGame(playerIdentifiers, evt, rc);
  console.log("ゲームを作成しました。");
  // game.startInfoから、ゲーム開始時の各種情報を取得できる。これはゲーム中のイベントではないので、コールバックにはしていない。
  console.log("" + game.startInfo.playerCount + "人でゲームを始めます。");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
void main().then(() => {
  rl.close();
});
