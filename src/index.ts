import * as readline from "readline";
import * as dfg from "dfg-simulator";

// 各種返還関連
const MarkToStringMap = new Map<dfg.CardMark, string>([
  [dfg.CardMark.CLUBS, "クラブ"],
  [dfg.CardMark.DIAMONDS, "ダイヤ"],
  [dfg.CardMark.HEARTS, "ハート"],
  [dfg.CardMark.SPADES, "スペード"],
  [dfg.CardMark.JOKER, "ジョーカー"],
]);

function cardMark2string(mark: dfg.CardMark): string {
  const ret = MarkToStringMap.get(mark);
  return ret ? ret : "";
}

const rankTypeToStringMap = new Map<dfg.RankType, string>([
  [dfg.RankType.UNDETERMINED, "順位未決定"],
  [dfg.RankType.DAIFUGO, "大富豪"],
  [dfg.RankType.FUGO, "富豪"],
  [dfg.RankType.HEIMIN, "平民"],
  [dfg.RankType.HINMIN, "貧民"],
  [dfg.RankType.DAIHINMIN, "大貧民"],
]);

function rankType2string(rankType: dfg.RankType): string {
  const ret = rankTypeToStringMap.get(rankType);
  return ret ? ret : "";
}

function card2string(card: dfg.Card): string {
  if (card.isJoker()) {
    return cardMark2string(card.mark);
  }
  return cardMark2string(card.mark) + "の" + card.cardNumber;
}

// プレイヤーとプレイヤー識別子をマップするオブジェクト
class PlayerMap {
  idToNameMap: Map<string, string>;
  constructor(identifiers: string[], names: string[]) {
    this.idToNameMap = new Map();
    for (let i = 0; i < names.length; i++) {
      this.idToNameMap.set(identifiers[i], names[i]);
    }
  }
  public id2name(identifier: string): string {
    const pn = this.idToNameMap.get(identifier);
    if (pn === undefined) {
      return "";
    }
    return pn;
  }
}

// ゲーム中のイベントをコールバックで受け取るためのオブジェクト。
// dfg.EventReceiver インターフェイスを満たす必要がある。
class EventReceiver implements dfg.EventReceiver {
  private playerMap: PlayerMap;
  constructor(playerMap: PlayerMap) {
    this.playerMap = playerMap;
  }
  public onNagare(): void {
    console.log("場のカードが流れました。");
  }
  public onAgari(identifier: string): void {
    console.log("あがり!");
  }
  public onYagiri(identifier: string): void {
    console.log("八切り!");
  }
  public onJBack(identifier: string): void {
    console.log("Jバック!");
  }
  public onKakumei(identifier: string): void {
    console.log("革命!");
  }
  public onStrengthInversion(strengthInverted: Boolean): void {
    const s = strengthInverted
      ? "カードの強さが逆になった!"
      : "カードの強さが元に戻った!";
    console.log(s);
  }
  public onDiscard(identifier: string, discardPair: dfg.DiscardPair): void {
    console.log("カードを捨てた!");
  }
  public onPass(identifier: string): void {
    console.log("パス。");
  }
  public onGameEnd(): void {
    console.log("ゲーム終了!");
  }
  public onPlayerKicked(identifier: string): void {
    console.log(this.playerMap.id2name(identifier) + "がゲームから抜けた!");
  }
  public onPlayerRankChanged(
    identifier: string,
    before: dfg.RankType,
    after: dfg.RankType
  ): void {
    if (before == dfg.RankType.UNDETERMINED) {
      console.log(
        this.playerMap.id2name(identifier) +
          "は、" +
          rankType2string(after) +
          "になった!"
      );
    } else {
      console.log(
        this.playerMap.id2name(identifier) +
          "は、" +
          rankType2string(before) +
          "から" +
          rankType2string(after) +
          "になった!"
      );
    }
  }
  public onInitialInfoProvided(playerCount: number, deckCount: number): void {
    console.log("" + playerCount + "人でゲームを始めます。");
    console.log("" + deckCount + "セットのデッキを使用します。");
  }
  public onCardsProvided(identifier: string, providedCount: number): void {
    const pn = this.playerMap.id2name(identifier);
    console.log(
      "" + pn + "に、" + providedCount + "枚のカードが配られました。"
    );
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
  const pm = new PlayerMap(playerIdentifiers, playerNames);
  const evt = new EventReceiver(pm);
  // これでやっとゲームが作れます。
  const game = dfg.createGame(playerIdentifiers, evt, rc);
  console.log("ゲームを作成しました。");
  // ゲームを作成したら、ターンを順番に回して、プレイヤーに行動を選択させます。
  // ターンはdfg-simulatorが自動で管理してくれます。
  // クライアント側は、game.startActivePlayerControlを呼び出して、次に行動すべきプレイヤーの捜査を開始します。
  // game.startActivePlayerControlが返してくる ActivePlayerControl というオブジェクトを経由して、プレイを決定します。
  let ended = false;
  while (true) {
    if (game.isEnded()) {
      ended = true;
      break;
    }
    const ctrl = game.startActivePlayerControl();
    // ctrl.playerIdentifier で、行動中のプレイヤーの識別子を取れる。
    console.log(pm.id2name(ctrl.playerIdentifier) + "のターン。");
    // ctrl.enumerateHandで、手札のリストを取れる。リストの中身は、 dfg.Card 型。
    const hand = ctrl.enumerateHand();
    // 行動が決まるまでループ
    let quit = false;
    let kicked = false;
    while (true) {
      for (let i = 0; i < hand.length; i++) {
        const cs = card2string(hand[i]);
        // 手札のインデックスを指定して、そのカードが現在チェックできるか（出せる可能性があるか）を調べることができる。
        // 結果の型は、dfg.CardSelectableResult。 SELECTABLE か ALREADY_SELECTED か NOT_SELECTABLE のどれか。
        const checkable =
          ctrl.checkCardSelectability(i) !=
          dfg.SelectabilityCheckResult.NOT_SELECTABLE;
        // 手札のインデックスを指定して、そのカードが現在チェック常態か（出す予定かどうか）を調べることができる。
        // これは boolean で返ってくる。
        const checked = ctrl.isCardSelected(i);
        // チェック可能なカードには番号を表示して、チェックされているカードには「チェック」と表示してみる。
        const prefix = checkable ? (i + 1).toString() + ": " : "";
        const suffix = checked ? "(チェック)" : "";
        console.log(prefix + cs + suffix);
      }
      console.log(
        "数値を入力して、出すカードをチェック/チェック解除。kでこのプレイヤーをキック。qでソフトを終了。"
      );
      const input = await inputFromUser("行動入力");
      if (input == "q") {
        quit = true;
        break;
      }
      if (input == "k") {
        kicked = true;
        break;
      }
      // 数値入力で、カードにチェックをつける
      let cn = parseInt(input);
      if (isNaN(cn)) {
        console.log("数値を読み取れません。");
        continue;
      }
      cn--; //見やすいように１を足して表示していたので
      // 入力されたインデックス番号のカードがチェックできるかどうか確かめる。
      // 手札の数より大きいインデックス番号を指定しても、isCardSelectableはエラーを出さない。
      const selectability = ctrl.checkCardSelectability(cn);
      if (
        selectability != dfg.SelectabilityCheckResult.SELECTABLE &&
        selectability != dfg.SelectabilityCheckResult.ALREADY_SELECTED
      ) {
        console.log("その番号のカードはチェックできません。");
      }
      // 選択状態に応じて、 selectCard と deselectCard を使い分ける。
      // toggle はあえて用意していない。明示的にやるほうがいい。
      // 結果としては、 dfg.CardSelectResult と dfg.CardDeselectResult を返してくるが、無視してもよい。
      if (!ctrl.isCardSelected(cn)) {
        ctrl.selectCard(cn);
      } else {
        ctrl.deselectCard(cn);
      }
    } // 行動選択
    // キック、終了、パス、カードを出すのどれかが決定した
    if (quit) {
      break;
    }
    if (kicked) {
      // game.kickPlayerByIdentifierで、識別子を指定してプレイヤーをゲームからキックできる。
      //　オンライン対戦で、接続の落ちたプレイヤーをゲームから閉め出すために利用できる。
      // 今回はサンプルアプリなので、とりあえず意味もなく使えるようにしておく。
      game.kickPlayerByIdentifier(ctrl.playerIdentifier);
    }
  }
  // 強制終了でなく、ちゃんとゲーム終了していたら、最終的なプレイヤーの順位を出力して終わる。
  if (ended) {
    console.log("最終結果:");
    game.enumeratePlayerRanks().forEach((v) => {
      console.log(pm.id2name(v.identifier) + ": " + rankType2string(v.rank));
    });
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
void main().then(() => {
  rl.close();
}).catch((reason)=>{
  console.log(reason.stack);
  console.log(reason);
  console.log("エラーにより終了しました。");
  rl.close();
});
