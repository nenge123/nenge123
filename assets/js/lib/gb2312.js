

function str2gb2312(str) {
    const ranges = [
        [0xA1, 0xA9, 0xA1, 0xFE],
        [0xB0, 0xF7, 0xA1, 0xFE],
        [0x81, 0xA0, 0x40, 0xFE],
        [0xAA, 0xFE, 0x40, 0xA0],
        [0xA8, 0xA9, 0x40, 0xA0],
        [0xAA, 0xAF, 0xA1, 0xFE],
        [0xF8, 0xFE, 0xA1, 0xFE],
        [0xA1, 0xA7, 0x40, 0xA0],
    ];
    let codes = new Uint16Array(23940);
    let i = 0;
    for (const [b1Begin, b1End, b2Begin, b2End] of ranges) {
        for (let b2 = b2Begin; b2 <= b2End; b2++) {
            if (b2 !== 0x7F) {
                for (let b1 = b1Begin; b1 <= b1End; b1++) {
                    codes[i++] = b2 << 8 | b1;
                }
            }
        }
    }
    let table =  new Uint16Array(65536);
    let gbkstr = new TextDecoder('gbk').decode(codes);
    for (let i = 0; i < gbkstr.length; i++) {
        table[gbkstr.charCodeAt(i)] = codes[i];
    }
    gbkstr = null;
    codes = null;
    let buf = [];
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 0x80) {
            buf.push(code);
            continue;
        }
        const gbk = table.at(code);
        if (gbk&&gbk !== 0xFFFF) {
            buf.push(gbk);
            buf.push(gbk >> 8);
        } else if (code === 8364) {
            // 8364 == '€'.charCodeAt(0)
            // Code Page 936 has a single-byte euro sign at 0x80
            buf.push(0x80);
        } else {
            buf.push(63);
            if(buf<=0xFF){
                //ISO-8859-1
            }
        }
    }
    table = null;
    return new Uint8Array(buf)
}