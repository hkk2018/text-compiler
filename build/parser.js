// 【深入淺出教你寫編譯器（Compiler）】二、掃瞄器（Scanner）﹣詞法分析（Lexical analysis）（上）
// http://inspiregate.com/programming/other/472-compiler-2.html
/**
 * 就三個 function， 一個 constructor，把要 compile 的字串傳入去，
 * 用 nextChar() 來讀取下一個字元，用 retract() 來退回。
 * 現在運行一下我們的 tester，看看Reader 是否運作正常。
 */
var Reader = /** @class */ (function () {
    /**
     *
     * @param str str is the data to be read
     */
    function Reader(str) {
        this.currPos = 0;
        this.dataStr = str;
        this.dataLength = str.length;
    }
    Reader.prototype.nextChar = function () {
        if (this.currPos >= this.dataLength)
            return -1; //end of stream
        return this.dataStr[this.currPos++];
    };
    //n is the number of characters to be retracted
    Reader.prototype.retract = function (n) {
        if (n === void 0) { n = 1; }
        this.currPos -= n;
        if (this.currPos < 0) {
            this.currPos = 0;
        }
    };
    return Reader;
}());
//Token class
//type: Token's type
//text: the actual text that makes this token, may be null if it is not important
var Token = /** @class */ (function () {
    function Token(type, text) {
        this.type = type;
        this.text = text;
        var tokenArr = ['EOS_TOKEN', 'COLON_TOKEN',
            'SEMICOLON_TOKEN', 'LEFTPAREN_TOKEN', 'RIGHTPAREN_TOKEN', 'LEFTBRACE_TOKEN', 'RIGHTBRACE_TOKEN', 'MOD_TOKEN'];
        this.tokens = new Tokens(tokenArr);
        this.backwardMap = {};
        for (var x in this.tokens) {
            this.backwardMap[this.tokens[x]] = x;
        }
    }
    return Token;
}());
var Tokens = /** @class */ (function () {
    function Tokens(tokenNameArr) {
        for (var i in tokenNameArr)
            this[tokenNameArr[i]] = Number(i) + 1;
    }
    return Tokens;
}());
var t = new Token(null, null);
console.log(new Token('', ''));
//Scanner class
//reader: the reader used to read in characters
var Scanner = /** @class */ (function () {
    function Scanner(reader) {
        this.reader = reader;
        this.START_STATE = 1; //every FSM should have a start state
        this.currentToken = new Token(null, null); //storing the current analysed token
        this.currLine = 0; //the line number of the current line being read
        this.state = this.START_STATE;
    }
    Scanner.prototype.makeToken = function (type, text) {
        this.currentToken.type = type;
        this.currentToken.text = text;
        return type;
    };
    Scanner.prototype.nextToken = function () {
        while (true) {
            switch (this.state) {
                case this.START_STATE:
                    var c = this.reader.nextChar();
                    switch (c) {
                        case ":":
                            return this.makeToken(t.tokens.COLON_TOKEN);
                            break;
                        case ";":
                            return this.makeToken(t.tokens.SEMICOLON_TOKEN);
                            break;
                        case "(":
                            return this.makeToken(t.tokens.LEFTPAREN_TOKEN);
                            break;
                        case ")":
                            return this.makeToken(t.tokens.RIGHTPAREN_TOKEN);
                            break;
                        case "{":
                            return this.makeToken(t.tokens.LEFTBRACE_TOKEN);
                            break;
                        case "}":
                            return this.makeToken(t.tokens.RIGHTBRACE_TOKEN);
                            break;
                        case "%":
                            return this.makeToken(t.tokens.MOD_TOKEN);
                            break;
                        case -1:
                            return this.makeToken(t.tokens.EOS_TOKEN);
                            break;
                        case "\r":
                        case "\n":
                            this.currLine++;
                        default:
                        //ignore them
                    }
                    break;
            }
        }
    };
    return Scanner;
}());
tryScanner('dasd,asdedWadas;d[kkkdasdwqreh;;qw,a=eqw');
function tryScanner(textToTry) {
    var reader = new Reader(textToTry);
    var scanner = new Scanner(reader);
    while (true) {
        var token = scanner.nextToken();
        if (token == t.tokens.EOS_TOKEN) {
            break;
        }
        console.log("Read token: " + t.backwardMap[token]);
    }
}
