/**
 * 就三個 function， 一個 constructor，把要 compile 的字串傳入去，
 * 用 nextChar() 來讀取下一個字元，用 retract() 來退回。
 * 現在運行一下我們的 tester，看看Reader 是否運作正常。
 */
declare class Reader {
    /**
     *
     * @param str str is the data to be read
     */
    constructor(str: string);
    dataStr: any;
    currPos: number;
    dataLength: any;
    nextChar(): any;
    retract(n?: number): void;
}
declare class Token {
    type: any;
    text: any;
    constructor(type: any, text: any);
    tokens: any;
    backwardMap: any;
}
declare class Tokens {
    constructor(tokenNameArr: string[]);
}
declare let t: Token;
declare class Scanner {
    reader: Reader;
    constructor(reader: Reader);
    START_STATE: number;
    currentToken: Token;
    currLine: number;
    state: number;
    makeToken(type: any, text?: any): any;
    nextToken(): any;
}
declare function tryScanner(textToTry: string): void;
