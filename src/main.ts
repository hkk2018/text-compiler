import * as fs from 'fs';
import * as recurReadDir from 'recursive-readdir';
import * as XLSX from 'xlsx';



let testFolder = './to-reads'

function exportArrayToExcel(displayOrder: Array<string>, firstRow: Object, dataObjArr: Object[]) {
    let ws = XLSX.utils.json_to_sheet([firstRow], { header: displayOrder, skipHeader: true });
    /* Append row */
    dataObjArr.map(dataObj => {
        XLSX.utils.sheet_add_json(ws, [dataObj], { header: displayOrder, skipHeader: true, origin: -1 });
    })
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TechDoc");
    XLSX.writeFile(wb, 'out.xlsx');
}

getNameContentTreeP().then(nct =>
    parseFileTree(nct)
).then(dataArr => {
    exportArrayToExcel(['dirName', 'fileName', 'libName', 'funcDef', 'comment'], { dirName: '資料夾名', fileName: '檔案名', libName: '函式庫名', funcDef: '函數定義', comment: '說明' }, dataArr)
})

/** 可能是函數名或者是library名 */
function pickoutCommentedItemDoc(text: string): { data: DocData, leftText: string } {
    // comment
    let cmHead = '/**'
    let cmTail = ' */\r\n'

    let cmHeadIndex = text.indexOf(cmHead);
    //沒有cm了就停了
    if (cmHeadIndex < 0) return
    //第一個找到的如果有肥版就用肥版，這樣可以去空格，但是如果是預設格式/** */則不變，這樣才不會抓錯。
    if (cmHeadIndex === text.indexOf(cmHead + ' ') && cmHeadIndex !== text.indexOf(cmHead + cmTail)) cmHead = cmHead + ' ';

    let cmStart = text.slice(text.indexOf(cmHead) + cmHead.length)
    let cmTailIndex = cmStart.indexOf(cmTail)
    let cm = cmStart.slice(0, cmTailIndex);
    let afterCm = cmStart.slice(cmTailIndex + cmTail.length)
    let funDef, libName, leftText;

    if (afterCm.indexOf('let ') !== -1 && afterCm.indexOf('let ') < afterCm.indexOf('\r\n')) {
        libName = afterCm.slice(afterCm.indexOf('let ') + 4, afterCm.indexOf(':'))
        leftText = afterCm.slice(afterCm.indexOf('\r\n') + 1)
    }
    else {
        funDef = afterCm.slice(0, afterCm.indexOf(';'))
        leftText = afterCm.slice(afterCm.indexOf(';') + 1)
    }

    //--- beautify comment
    let pointer = 0
    let foolProofConut = 0;
    while (pointer < cm.length) {
        if (foolProofConut === 0) {
            let lbIndex = cm.indexOf('\n')
            if (lbIndex !== -1)
                cm = cm.slice(lbIndex + 1)
        }

        if (cm[pointer] === ' ' || cm[pointer] === '*') cm = removeCharAt(cm, pointer)
        else {
            let lbIndex = cm.indexOf('\n', pointer)
            if (lbIndex === -1) pointer = cm.length

            else pointer = lbIndex + 1
        }

        foolProofConut++
        if (foolProofConut > 100000) {
            console.error('infinite loop');
            break
        }
    }
    if (cm[cm.length - 1] === '\n') cm = removeCharAt(cm, cm.length - 1)
    cm = cm.replace(/\r/g, '');

    return {
        data: {
            funcDef: funDef ? funDef.trim() : null,
            comment: cm,
            libName: libName ? libName : null,
        },
        leftText: leftText
    }
}


function removeCharAt(str: string, i: number) {
    return str.slice(0, i) + str.slice(i + 1, str.length)
}

interface DocData {
    funcDef?: string,
    comment: string,
    libName?: string,
}

function pickOutAllCommentedFunc(text: string) {


}

function parseFileTree(nct: NameContentTree) {
    interface TechDataStrucure extends DocData {
        dirName: string
        fileName: string,
        libName?: string,
    }
    let dataArr: TechDataStrucure[] = [];
    crawl(nct)

    function crawl(obj, dirName?: string) {
        let laterToCrawlIntoKeys = [];
        for (let key in obj) {
            if (typeof obj[key] === 'string') {//一個.d.ts檔案的全文字
                let foolProofCount = 0
                let codeOfOneFile = obj[key]
                while (true) {
                    let resultObj = pickoutCommentedItemDoc(codeOfOneFile)
                    if (!resultObj) break;
                    dataArr.push({ dirName: dirName || null, fileName: key, libName: resultObj.data.libName, funcDef: resultObj.data.funcDef, comment: resultObj.data.comment })
                    if (resultObj.leftText.indexOf('/**') < 0) break
                    else codeOfOneFile = resultObj.leftText
                    foolProofCount++
                    if (foolProofCount > 20000) {
                        console.error('無限迴圈')
                        break
                    }
                }
            }
            else laterToCrawlIntoKeys.push(key)
        }
        laterToCrawlIntoKeys.map(key => crawl(obj[key], key))
    }
    return dataArr
}

function getKeyChain(path: string) {
    let slashIndex;
    let keyArr = []
    let foolPreventConut = 0;
    while (true) {
        slashIndex = path.indexOf('\\')
        if (slashIndex === -1) {
            keyArr.push(path)
            break
        }
        else {
            keyArr.push(path.slice(0, slashIndex))
            path = path.slice(slashIndex + 1)
        }

        foolPreventConut++;
        if (foolPreventConut > 1000) break;
    }
    // console.log(keyArr);

    return keyArr

}

function setValueByTracingToLeaf(traceArr: string[], data: any, objToSaveAt) {
    let currObjRef = objToSaveAt;
    for (let i = 0; i < traceArr.length; i++) {
        let key = traceArr[i]
        if (i === traceArr.length - 1) {
            currObjRef[key] = data
        }
        else {
            if (!currObjRef[key]) currObjRef[key] = {}
            currObjRef = currObjRef[key];
        }
    }
}


function getNameContentTreeP(): Promise<NameContentTree> {

    let fileTree = {}
    let pAll = []
    return recurReadDirP().then(filePaths => {
        filePaths.forEach(filePath => {
            pAll.push(readFileP(filePath).then(data => {
                setValueByTracingToLeaf(getKeyChain(filePath), data, fileTree)
            }))
        });
        return Promise.all(pAll)
    }).then(() => {
        // console.log(fileTree);
        return fileTree
    })

}

interface NameContentTree {
    [name: string]: NameContentTree | string
}


function recurReadDirP(rootFolder = './to-reads'): Promise<Array<string>> {
    return new Promise((res, rej) => {
        recurReadDir(rootFolder, ['*.js'], function (err, filePaths) {
            if (err) rej();
            else res(filePaths)
        });
    })
}



function readFileP(path: string, encoding = 'utf8'): any {
    return new Promise((res, rej) => {
        fs.readFile(path, encoding, (err, data) => {
            if (err) rej()
            else res(data)
        })
    })
}


