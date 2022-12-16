export const pjclBaseBitLength = 24;
export const pjclBase = 1 << pjclBaseBitLength;
export const pjclBaseMask = pjclBase - 1;
export const pjclBaseMaskMinusOne = pjclBaseMask - 1;
export const pjclBaseInv = 1 / pjclBase;
export const pjclBaseAsBigInt = [0,1];
export const pjclHalfBase = 1 << (pjclBaseBitLength - 1);

// begin arg checking
function pjclWellFormed(x) {
    if (
        x === undefined ||
        x.constructor !== Array || 
        (x.length == 0 && x.negative) || 
        (x.length > 0 && x[x.length - 1] == 0)
    ) {
        return false;
    }
    return true;
}

function pjclIsBitArray(x,l) {
    if (
        x === undefined ||
        x.constructor !== Array
    ) {
        return false;
    }
    if (l && x.length != l) {
        return false;
    }
    for (var i = 0; i < x.length; i++) {
        if (!(x[i] === 0 || x[i] === 1)) {
            return false;
        }
    }
    return true;    
}

function pjclIsArray(x,l) {
    if (
        x === undefined ||
        x.constructor !== Array
    ) {
        return false;
    }
    if (l && x.length != l) {
        return false;
    }
    return true;    
}

function pjclCheckString(s) {
    if (typeof s != "string") {throw new Error("s is not a string");}
}

function pjclCheckASCIIString(s) {
    pjclCheckString(s);
    for (var i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) > 0x7F) {throw new Error("s[" + i + "] is not ASCII");}
    }
}

function pjclIsPoint(P) {
    if (!pjclWellFormed(P.x) || P.x.negative || !pjclWellFormed(P.y) || P.y.negative || !pjclWellFormed(P.z) || P.z.negative) {
        return false;
    }
    return true;      
}
// end arg checking

export function pjclBigInt_from_ES11BigInt(i) {
    // begin arg checking
    if (typeof x !== "bigint") {throw new Error("i not an ES11 BigInt in pjclBigInt_from_ES11BigInt");}
    // end arg checking
    const _pjclBaseBitLength = BigInt(pjclBaseBitLength),
          _pjclBaseMask = BigInt(pjclBaseMask);
    var x = [];
    if (i < 0) {
        x.negative = true;
        i = -i;
    }
    while (i) {
        x.push(Number(i & _pjclBaseMask)));
        i >>= _pjclBaseBitLength;
    }
    return x;
}

export function pjclBigInt_to_ES11BigInt(x) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error("x not well formed in pjclBigInt_to_ES11BigInt");}
    // end arg checking
    const _pjclBaseBitLength = BigInt(pjclBaseBitLength);
    var i = x.reduceRight((i, nextLeg) => (
        (i << _pjclBaseBitLength) | BigInt(nextLeg)
    ), BigInt(0));
    if (x.negative)
        return -i;
    return i;
}

export function pjclByte2BitArray(byte) {
    return [(byte >>> 7) & 1, (byte >>> 6) & 1, (byte >>> 5) & 1, (byte >>> 4) & 1, (byte >>> 3) & 1, (byte >>> 2) & 1, (byte >>> 1) & 1, byte & 1];
}

export function pjclByteArray2BitArray(byteArray) {
    var bitArray = [];
    for (var i = 0; i < byteArray.length; i++) {
        var bits = pjclByte2BitArray(byteArray[i]);
        bitArray.push(bits[0], bits[1], bits[2], bits[3], bits[4], bits[5], bits[6], bits[7]);
    }
    return bitArray;    
}

export function pjclBitArray2ByteArray(bitArray) {
    var bitLen = bitArray.length;
    // begin arg checking
    if ((bitLen & 7) != 0) {throw new Error(" bitArray length not a multiple of 8 ");}
    // end arg checking 
    var byteArray = [];
    var bytePos = 0;
    var byte = 0;
    var i,j;
    for (i = 0, j = 7; i < bitLen; i++, j--) {
        byte |= (bitArray[i] << j);
        if (j == 0) {
            byteArray[bytePos++] = byte;
            j = 8;
            byte = 0;
        }
    }
    return byteArray;
}

export function pjclString2ByteArray_ASCII(s) {
    // begin arg checking
    pjclCheckASCIIString(s);
    // end arg checking
    var byteArray = [];
    for (var i = 0; i < s.length; i++) {
        byteArray.push(s.charCodeAt(i)); 
    }
    return byteArray;
}

export function pjclString2BitArray_ASCII(s) {
    // begin arg checking
    pjclCheckASCIIString(s);
    // end arg checking
    var bitArray = [];
    for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        bitArray.push((c>>7) & 1,(c>>6) & 1,(c>>5) & 1,(c>>4) & 1, (c>>3) & 1,(c>>2) & 1,(c>>1) & 1, c & 1); 
    }
    return bitArray;
}                                
export const pjclASCII2BitArray = pjclString2BitArray_ASCII;

export function pjclString2ByteArray_UTF8(s) {
    // begin arg checking
    pjclCheckString(s);
    //end arg checking
    var byteArray = [];
    var bytePos = 0;
    for (var i = 0; i < s.length; i++) {
        var charCode = s.charCodeAt(i);
        var codePoint;
        if ((0xD800 <= charCode) && (charCode < 0xDC00)) {
            var highTenBits = charCode - 0xD800;
            // begin arg checking
            if (i == s.length - 1) {throw new Error("s ends at high surrogate");}
            // end arg checking
            var nextCharCode = s.charCodeAt(++i);
            var lowTenBits = nextCharCode - 0xDC00;
            // begin arg checking
            if (lowTenBits > 0x3FF) {throw new Error("high surrogate not followed by low surrogate");}
            // end arg checking
            var codePoint = 0x10000 + lowTenBits + (highTenBits << 10);
        }
        else {
            codePoint = charCode;
        }
        if (codePoint <= 0x7F) {
            byteArray[bytePos++] = codePoint;
        }
        else if (codePoint <= 0x7FF) {
            byteArray[bytePos++] = 0xC0 + ((0x7C0 & codePoint) >> 6);
            byteArray[bytePos++] = 0x80 + (0x3F & codePoint);
        }
        else if (codePoint <= 0xFFFF) {
            byteArray[bytePos++] = 0xE0 + ((0xF000 & codePoint) >> 12);
            byteArray[bytePos++] = 0x80 + ((0xFC0 & codePoint) >> 6);
            byteArray[bytePos++] = 0x80 + (0x3F & codePoint);
        }
        else {
            byteArray[bytePos++] = 0xF0 + ((0x1C0000 & codePoint) >> 18);
            byteArray[bytePos++] = 0x80 + ((0x3F000 & codePoint) >> 12);
            byteArray[bytePos++] = 0x80 + ((0xFC0 & codePoint) >> 6);
            byteArray[bytePos++] = 0x80 + (0x3F & codePoint);
        }
    }
    return byteArray;
}

export function pjclString2BitArray_UTF8(s) {
    return pjclByteArray2BitArray(pjclString2ByteArray_UTF8(s));
}

export function pjclString2ByteArray_UTF16BE(s) {
    // begin arg checking
    pjclCheckString(s);
    //end arg checking
    var byteArray = [];
    var bytePos = 0;
    for (var i = 0; i < s.length; i++) {
        var code = s.charCodeAt(i);
        byteArray[bytePos++] = (code & 0xFF00) >> 8;
        byteArray[bytePos++] = code & 0xFF;
    }
    return byteArray;
}

export function pjclString2BitArray_UTF16BE(s) {
    // begin arg checking
    pjclCheckString(s);
    //end arg checking
    var i;
    var bitArray = [];
    for (i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    bitArray.push(
        (c>>15) & 1,(c>>14) & 1,(c>>13) & 1,(c>>12) & 1, (c>>11) & 1,(c>>10) & 1,(c>>9) & 1, (c>>8) & 1,
        (c>>7) & 1,(c>>6) & 1,(c>>5) & 1,(c>>4) & 1, (c>>3) & 1,(c>>2) & 1,(c>>1) & 1, c & 1); 
    }
    return bitArray;
}
export const pjclUTF16toBitArray = pjclString2BitArray_UTF16BE;            

export function pjclString2ByteArray_UTF16LE(s) {
    // begin arg checking
    pjclCheckString(s);
    //end arg checking
    var byteArray = []
    var bytePos = 0;
    for (var i = 0; i < s.length; i++) {
        var code = s.charCodeAt(i);
        byteArray[bytePos++] = code & 0xFF;
        byteArray[bytePos++] = (code & 0xFF00) >> 8;
    }
    return byteArray;
}

export function pjclString2BitArray_UTF16LE(s) {
    return pjclByteArray2BitArray(pjclString2ByteArray_UTF16LE(s));
}

export function pjclUI32toBitArray(ui32) {
    var bitArray = [];
    for (var i = 31; i >= 0; i--) {
        bitArray.push((ui32 >>> i) & 1);
    }
    return bitArray;    
}

export function pjclUI32Array2BitArray(x) {
    var bitArray = [];
    for (var i = 0; i < x.length; i++) {
        bitArray = bitArray.concat(pjclUI32toBitArray(x[i]));
    }
    return bitArray;
}

export function pjclUI32Array2ByteArray(x) {
    var byteArray = [];
    for (var i = 0; i < x.length; i++) {
        var u = x[i];
        byteArray.push((u & 0xFF000000) >>> 24, (u & 0x00FF0000) >>> 16, (u & 0x0000FF00) >>> 8, u & 0x000000FF);
    }
    return byteArray;
}

export function pjclBigInt2ByteArray(x,minByteLength) {
    if (minByteLength === undefined) {
        minByteLength = 0;
    }
    var byteArray = [];
    for (var i = x.length - 1; i >= 0; i--) {
        var u = x[i];
        byteArray.push((u & 0xFF0000) >>> 16, (u & 0xFF00) >>> 8, u & 0xFF);
    }
    var l = byteArray.length;
    for (var i = l; i < minByteLength; i++) {
        byteArray.unshift(0);
    }
    while (l-- > minByteLength && byteArray[0] == 0) {
        byteArray.shift();
    }
    return byteArray;    
}

export function pjclBigInt2BitArray(x) {
    var bitArray = [];
    for (var i = x.length - 1; i >= 0; i--) {
        var u = x[i];
        for (var j = pjclBaseBitLength - 1; j >= 0; j--) {
            bitArray.push((u >>> j) & 1);
        }
    }
    while (bitArray.length > 0 && bitArray[0] == 0) {
        bitArray.shift();
    }
    return bitArray;    
}

export function pjclBigInt2SizedBitArray(x,size) {
    var bitArray = [];
    for (var i = x.length - 1; i >= 0; i--) {
        var u = x[i];
        for (var j = pjclBaseBitLength - 1; j >= 0; j--) {
            bitArray.push((u >>> j) & 1);
        }
    }
    if (size > bitArray.length) {
        for (var i = 0; i < size - bitArray.length; i++) {
            bitArray.unshift(0);
        }
    }
    else if (bitArray.length > size) {
        bitArray.splice(0,bitArray.length - size);
    }
    return bitArray;    
}

export function pjclBitLengthOfBigInt(x) {
    var l = x.length;
    if (l-- == 0) {
        return 0;
    }
    var i = pjclHalfBase;
    var j = pjclBaseBitLength;
    while (true) { // not an infinite loop if x is well-formed, which implies that x[l] is not 0
        if ((i & x[l]) != 0) {
            break;
        }
        i = i >>> 1;
        j--;
    }
    return j + pjclBaseBitLength * l;    
}

export function pjclBitArray2UI32Array(bitArray) {
    // begin arg checking
    if ((bitArray.length & 0x1F) != 0) {throw new Error("length of bitArray not multiple of 32")};
    // end arg checking
    var a = [];
    var k = 0;
    for (var i = 0; i < bitArray.length >>> 5; i++) {
        a[i] = 0;
        for (var j = 31; j >= 0; j--,k++) {
            a[i] = a[i] | bitArray[k] << j;        
        }
    }
    return a;
}
    
export function pjclBitArray2BigInt(bitArray) {
    bitArray = bitArray.concat().reverse();
    var finalArray = [];
    var counter = 0;
    var limb = 0;
    var i,j;
    for (i = j = 0; i < bitArray.length; i++, j++) {
            limb |= (bitArray[i] << j);
            if (j == pjclBaseBitLength - 1) {
                finalArray[counter] = limb;
                j = -1;
                counter = counter + 1;
                limb = 0;
            }
    }
    if (j != -1) {
        finalArray[counter] = limb;
    }
    var l = finalArray.length;
    while (l > 0) {
        if (finalArray[--l] != 0) {
            l++;    
            break;
        }
    }
    finalArray.length = l;    
    return finalArray;
}

export function pjclBitArray2Hex(bitArray,minHexLength) {
    var s = "";
    var d = 0;
    var i = 0
    var extraBits = bitArray.length & 3;
    if (extraBits > 0) {
        for ( ; i < extraBits; i++) {
            d |= bitArray[i] << (extraBits - 1 - i);        
        }
        s += d.toString(16);
        d = 0;
    }
    for (var j = 3; i < bitArray.length; i++, j--) {
        d |= (bitArray[i] << j); 
        if (j == 0) {
            s += d.toString(16);
            j = 4;
            d = 0;
        }        
    }
    if (minHexLength === undefined) {
        return s;
    }
    var prefix = "";
    for (var k = 0; k < minHexLength - s.length; k++) {
        prefix += "0";
    }
    return prefix + s;
}

export function pjclHex2BitArray(s) {
    var i;
    var bitArray = [];
    for (i = 0; i < s.length; i++) {
        switch (s.charAt(i)){
            case "0":
            bitArray.push(0,0,0,0);
            break;
            
            case "1":
            bitArray.push(0,0,0,1);
            break;
            
            case "2":
            bitArray.push(0,0,1,0);
            break;
            
            case "3":
            bitArray.push(0,0,1,1);
            break;
            
            case "4":
            bitArray.push(0,1,0,0);
            break;
            
            case "5":
            bitArray.push(0,1,0,1);
            break;
            
            case "6":
            bitArray.push(0,1,1,0);
            break;
            
            case "7":
            bitArray.push(0,1,1,1);
            break;
            
            case "8":
            bitArray.push(1,0,0,0);
            break;
            
            case "9":
            bitArray.push(1,0,0,1);
            break;
            
            case "a":
            case "A":
            bitArray.push(1,0,1,0);
            break;
            
            case "b":
            case "B":
            bitArray.push(1,0,1,1);
            break;
            
            case "c":
            case "C":
            bitArray.push(1,1,0,0);
            break;
            
            case "d":
            case "D":
            bitArray.push(1,1,0,1);
            break;
            
            case "e":
            case "E":
            bitArray.push(1,1,1,0);
            break;
            
            case "f":
            case "F":
            bitArray.push(1,1,1,1);
            break;
            
            // begin arg checking
            default:  
            throw new Error("Argument not hex string");
            // end arg checking  
        }
    }
    return bitArray;
}

export function pjclHex2ByteArray(s) {
    return pjclBitArray2ByteArray(pjclHex2BitArray(s));
}

export function pjclByteArray2Hex(byteArray) {
    return pjclBitArray2Hex(pjclByteArray2BitArray(byteArray));
}
    
export function pjclHex2BigInt(s) {
    var bitArray = pjclHex2BitArray(s);
    return pjclBitArray2BigInt(bitArray);
}

export function pjclBigInt2Hex(x,minHexLength) {
    return pjclBitArray2Hex(pjclBigInt2BitArray(x),minHexLength);
}

export function pjclUI32toHex(x) {
    var finalString = "";
    for (var j = 0; j <= 7; j++) {
        finalString += "" + ((x >>> ((7 - j) * 4)) & 0xF).toString(16);
    }
    return finalString;    
}

export function pjclUI32Array2Hex(x) {
    var finalString = "";
    for (var i = 0; i < x.length; i++) {
        finalString += pjclUI32toHex(x[i]);
    }
    return finalString;
}

export function pjclGreaterThan(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclGreaterThan ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclGreaterThan ");}
    // end arg checking
    var lx = x.length;
    var ly = y.length;
    if (lx > ly) {
        return true;
    }
    if (lx < ly) {
        return false;
    }
    for (var i = lx - 1; i >= 0; i--) {
        if (x[i] > y[i]) {
            return true;
        }
        if (x[i] < y[i]) { 
            return false;
        }
    }
    return false;
}

export function pjclGreaterThanRel(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclGreaterThanRel ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclGreaterThanRel ");}
    // end arg checking    
    var lx = x.length;
    var ly = y.length;
    if (x.negative) {
        if (y.negative) {
            if (lx > ly) {
                return false;
            }    
            if (lx < ly) {
                return true;
            }
            for (var i = lx - 1; i >= 0; i--) {
                if (x[i] > y[i]) {
                    return false;
                }
                if (x[i] < y[i]) { 
                    return true;
                }
            }
        }
        return false;
    }
    else if (y.negative) {
        return true;
    }
    else {
        if (lx > ly) {
            return true;
        }
        if (lx < ly) {
            return false;
        }
        for (var i = lx - 1; i >= 0; i--) {
            if (x[i] > y[i]) {
                return true;
            }
            if (x[i] < y[i]) { 
                return false;
            }
        }
        return false;
    }
}

export function pjclGreaterThanOrEqual(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclGreaterThanOrEqual ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclGreaterThanOrEqual ");}
    //end arg checking
    var lx = x.length;
    var ly = y.length;
    if (lx > ly) {
        return true;
    }
    if (lx < ly) {
        return false;
    }
    for (var i = lx - 1; i >= 0; i--) {
        if (x[i] > y[i]) {
            return true;
        }
        if (x[i] < y[i]) {
            return false;
        }
    }
    return true;
}

export function pjclGreaterThanOrEqualRel(x,y) {
    // begin arg checking 
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclGreaterThanRel ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclGreaterThanRel ");}
    // end arg checking    
    var lx = x.length;
    var ly = y.length;
    if (x.negative) {
        if (y.negative) {
            if (lx > ly) {
                return false;
            }    
            if (lx < ly) {
                return true;
            }
            for (var i = lx - 1; i >= 0; i--) {
                if (x[i] > y[i]) {
                    return false;
                }
                if (x[i] < y[i]) { 
                    return true;
                }
            }
            return true;
        }
        return false;
    }
    else if (y.negative) {
        return true;
    }
    else {
        if (lx > ly) {
            return true;
        }
        if (lx < ly) {
            return false;
        }
        for (var i = lx - 1; i >= 0; i--) {
            if (x[i] > y[i]) {
                return true;
            }
            if (x[i] < y[i]) { 
                return false;
            }
        }
        return true;
    }
}

export function pjclEqual(x,y) {
    // begin arg checking 
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclEqual ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclEqual ");}
    // end arg checking    
    if (x.length != y.length) {
        return false;
    }
    for (var i = 0; i < x.length; i++) {
        if (x[i] != y[i]) {
            return false;
        }
    }
    return true;
}
        
export function pjclEqualRel(x,y) {
    // begin arg checking 
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclEqualRel ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclEqualRel ");}
    // end arg checking    
    if (x.negative && !y.negative) {
        return false;
    }
    if (y.negative && !x.negative) {
        return false;
    }
    if (x.length != y.length) {
        return false;
    }
    for (var i = 0; i < x.length; i++) {
        if (x[i] != y[i]) {
            return false;
        }
    }
    return true;
}
 
export function pjclAdd(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclAdd ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclAdd ");}
    // end arg checking
    var z = [ ];
    var lx = x.length;
    var ly = y.length;
    var long, lshort, llong; 
    if (lx < ly) {
        lshort = lx;
        long = y;
        llong = ly;
    }
    else {
        lshort = ly;
        long = x;
        llong = lx;
    }
    var carry = 0;
    for (var i = 0; i < lshort; i++) {
        z[i] = x[i] + y[i] + carry;
        if (z[i] >= pjclBase) {
            carry = 1;
            z[i] = z[i] - pjclBase;
        }
        else {
            carry = 0;
        }
    }
    for (var j = lshort; j < llong; j++) {    
        z[j] = long[j] + carry;
        if (z[j] >= pjclBase) {
            carry = 1;
            z[j] = z[j] - pjclBase;
        }
        else {
            carry = 0;
        }
    }
    if (carry == 1) {
        z[llong] = 1;
    }
    return z;
}

export function pjclAddRel(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclAddRel ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclAddRel ");}
    // end arg checking
    var z;
    if (x.negative) {
        if (y.negative) {
            z = pjclAdd(x,y);
            z.negative = true;
        }
        else {
            if (pjclGreaterThan(x,y)) {
                z = pjclSub(x,y);
                z.negative = true;
            }
            else if (pjclGreaterThan(y,x)) {
                z = pjclSub(y,x);
            }
            else {
                z = [];
            }
        }
    }
    else {
        if (y.negative) {
            if (pjclGreaterThan(x,y)) {
                z = pjclSub(x,y);
            }
            else if (pjclGreaterThan(y,x)) {
                z = pjclSub(y,x);
                z.negative = true;
            }
            else {
                z = [];
            }
        }
        else {
            z = pjclAdd(x,y);
        }
    }
    return z
}

export function pjclSub(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclSub ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclSub ");}
    if (!pjclGreaterThanOrEqual(x,y)) {throw new Error(" |x| not >= |y| in pjclSub ");}
    // end arg checking
    var lx = x.length
    var ly = y.length; 
    var carry = 0;
    var i;
    var z = [];
    for (i = 0; i < ly; i++) {
        if (carry == 1) {
            if (y[i] > x[i] - 1) {
                z[i] = pjclBase + (x[i] - 1) - y[i];
                carry = 1;    
            }
            else {
                z[i] = (x[i] - 1) - y[i];
                carry = 0;        
            }
        }
        else if (y[i] > x[i]) {
            z[i] = pjclBase + x[i] - y[i];
            carry = 1;
        }
        else {
            z[i] = x[i] - y[i];
            carry = 0;
        }
    }
    for ( /* Empty statement */ ; i < lx; i++) {
        if (carry == 1) {
            if (x[i] == 0) {
                z[i] = pjclBase - 1 ;
                carry = 1;
            } 
            else {
                z[i] = (x[i] - 1);
                carry = 0;        
            }
        }
        else {
            z[i] = x[i];
            carry = 0;
        }
    }
    var l = lx; // lx == z.length
    while (l > 0) {
        if (z[--l] != 0) {
            l++
            break;
        }
    }    
    z.length = l;
    return z;
}

export function pjclSubRel(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclSubRel ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclSubRel ");}
    // end arg checking
    var z;
    if (x.negative) {
        if (y.negative) {
            if (pjclGreaterThan(x,y)) { 
                z = pjclSub(x,y);
                z.negative = true;
            }
            else {
                z = pjclSub(y,x);
            }
        }
        else {
            z = pjclAdd(x,y);
            z.negative = true;
        }
    }
    else {
        if (y.negative) {
            z = pjclAdd(x,y);
        }
        else {
            if (pjclGreaterThan(x,y)) {
                z = pjclSub(x,y);
            }
            else {
                z = pjclSub(y,x);
                if (z.length > 0) {
                    z.negative = true;
                }
            }
        }
    }
    return z;
}

export let pjclMult = pjclMult_Long;
export let pjclSqr = pjclSqr_Long;
// export let pjclMult = pjclMult_Karatsuba;
// export let pjclSqr = pjclSqr_Karatsuba;

export function pjclMult_Long(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclMult_Long ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclMult_Long ");}
    // end arg checking
    var m = x.length;
    var n = y.length;
    if (m == 0 || n == 0) {
        return [];
    }
    var z = [];
    var i,j,k,l,u,v,carry;
    for (i = 0; i < m + n; i++) {
        z[i] = 0;
    }
    for (i = j = 0; i < m; i = j) {
        for ( ; j < m && j < i + 32; j++) {
            for (k = 0; k < n; k++) {
                z[j+k] += x[j] * y[k];
            }    
        }
        carry = 0;
        for (l = i; l < j + n - 1; l++) {
            u = z[l] + carry;
            v = u & pjclBaseMask;
            z[l] = v;
            carry = (u - v) * pjclBaseInv;    
        }
        z[l] = carry;
    }
    if (z[m + n - 1] == 0) {
        z.length = m + n - 1;
    }
    return z; 
} 

// use Meta/KaratsubaThresholds.html to find the optimal threshold for a particular machine 
//
export function pjclMult_Karatsuba(x,y,threshold = 150 /* 150 limbs = 3600 bits */) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclMult_Karatsuba ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclMult_Karatsuba ");}
    // end arg checking
    var xlength = x.length;
    var ylength = y.length;
    if (xlength == 0 || ylength == 0) {
        return [];
    }
    var longestlength = Math.max(xlength, ylength);
    if (longestlength <= threshold) {
        return pjclMult_Long(x,y); 
    }
    var l = Math.ceil(longestlength/2);
    var x0, x1, y0, y1;
    var i;
    if (xlength > l) {
        x1 = x.slice(l);
        x0 = x.slice(0,l);
        i = x0.length;
        while (i > 0) {
            if (x0[--i] != 0) {
                i++
                break;
            }
        }
        x0.length = i;
    }
    if (ylength > l) {
        y1 = y.slice(l);
        y0 = y.slice(0,l);
        i = y0.length;
        while (i > 0) {
            if (y0[--i] != 0) {
                i++
                break;
            }
        }
        y0.length = i;
    }
    var btail = [];
    for (i = 0; i < l; i++) {
        btail.push(0);
    }
    var s, t;
    if (ylength <= l) { // xlength > l
        s = pjclMult_Karatsuba(x1, y);
        t = pjclMult_Karatsuba(x0, y);
        return pjclAdd(btail.concat(s), t);
    }
    if (xlength <= l) { // ylength > l
        s = pjclMult_Karatsuba(y1, x);
        t = pjclMult_Karatsuba(y0, x);
        return pjclAdd(btail.concat(s), t);
    }
    var u = pjclMult_Karatsuba(x1, y1); // l-1 <= u.length <= 2*l
    var x1_x0 = pjclSubRel(x1, x0); // can be 0
    var y1_y0 = pjclSubRel(y1, y0); // can be 0
    var v = pjclMult_Karatsuba(x1_x0, y1_y0); // 0 <= v.length <= 2*l
    var w = pjclMult_Karatsuba(x0, y0); // 0 <= w.length <= 2*l

    var z = w.slice(0,l);
    for (i = z.length; i < l; i++) { // in case w.length < l, in which case z.length == w.length < 1
        z.push(0);
    }

    var carry = 0;
    var a, b;
    if ((x1_x0.negative && y1_y0.negative) || (!x1_x0.negative && !y1_y0.negative)) {
        for ( ; i < 2*l-1; i++) {
            a = (w[i] || 0) + (w[i-l] || 0) - (v[i-l] || 0) + u[i-l] + carry;
            if (a < 0) {
                z[i] = a + pjclBase;
                carry = -1;
            }
            else if (a >= pjclBase) {
                z[i] = a & pjclBaseMask;
                carry = a >>> pjclBaseBitLength;
            }
            else {
                z[i] = a;
                carry = 0;
            }
        }
        a = (w[i] || 0) + (w[i-l] || 0) - (v[i-l] || 0) + (u[i-l] || 0) + carry;
        if (a < 0) {
            z[i] = a + pjclBase;
            carry = -1;
        }
        else if (a >= pjclBase) {
            z[i] = a & pjclBaseMask;
            carry = a >>> pjclBaseBitLength;
        }
        else {
            z[i] = a;
            carry = 0;
        }
        i++;
                
        for ( ; i < 3*l-1; i++) {
            a = (w[i-l] || 0) - (v[i-l] || 0) + (u[i-l] || 0) + u[i - 2*l] + carry;
            if (a < 0) {
                z[i] = a + pjclBase;
                carry = -1;
            }
            else if (a >= pjclBase) {
                z[i] = a & pjclBaseMask;
                carry = a >>> pjclBaseBitLength;
            }
            else {
                z[i] = a;
                carry = 0;
            }
        }
        a = (w[i-l] || 0) - (v[i-l] || 0) + (u[i-l] || 0) + (u[i - 2*l] || 0) + carry;
        if (a < 0) {
            z[i] = a + pjclBase;
            carry = -1;
        }
        else if (a >= pjclBase) {
            z[i] = a & pjclBaseMask;
            carry = a >>> pjclBaseBitLength;
        }
        else {
            z[i] = a;
            carry = 0;
        }
        i++;
                
        for ( ; i < 2*l + u.length; i++) {
            a = u[i-2*l] + carry;
            if (a < 0) {
                z[i] = a + pjclBase;
                carry = -1;
            }
            else if (a >= pjclBase) {
                z[i] = a - pjclBase;
                carry = 1;
            }
            else {
                z[i] = a;
                carry = 0;
            }
        }
        
        if (carry > 0) {  // remark: carry can be greater than 1, if u.length is not greater than l
            z[i] = carry;
        }
        else { // negative carries can cause any number of leading zero limbs
            while (i > 0) {
                if (z[--i] != 0) {
                    i++
                    break;
                }
            }
            z.length = i;
        }
    }
    else { 
        for ( ; i < 2*l-1; i++) {
            a = (w[i] || 0) + (w[i-l] || 0) + (v[i-l] || 0) + u[i-l] + carry;
            if (a >= pjclBase) {
                z[i] = a & pjclBaseMask;
                carry = a >>> pjclBaseBitLength;
            }
            else {
                z[i] = a;
                carry = 0;
            }
        }
        a = (w[i] || 0) + (w[i-l] || 0) + (v[i-l] || 0) + (u[i-l] || 0) + carry;
        if (a >= pjclBase) {
            z[i] = a & pjclBaseMask;
            carry = a >>> pjclBaseBitLength;
        }
        else {
            z[i] = a;
            carry = 0;
        }
        i++;
                    
        for ( ; i < 3*l-1; i++) {
            a = (w[i-l] || 0) + (v[i-l] || 0) + (u[i-l] || 0) + u[i - 2*l] + carry;
            if (a >= pjclBase) {
                z[i] = a & pjclBaseMask;
                carry = a >>> pjclBaseBitLength;
            }
            else {
                z[i] = a;
                carry = 0;
            }
        }
        a = (w[i-l] || 0) + (v[i-l] || 0) + (u[i-l] || 0) + (u[i - 2*l] || 0) + carry;
        if (a >= pjclBase) {
            z[i] = a & pjclBaseMask;
            carry = a >>> pjclBaseBitLength;
        }
        else {
            z[i] = a;
            carry = 0;
        }
        i++;
        
        for ( ; i < 2*l + u.length; i++) {
            a = u[i-2*l] + carry;
            if (a >= pjclBase) {
                z[i] = a - pjclBase;
                carry = 1;
            }
            else {
                z[i] = a;
                carry = 0;
            }
        }
        
        if (carry > 0) {  // remark: carry can be greater than 1, if u.length is not greater than l
            z[i] = carry;
        }
    }
    return z;
}

export function pjclMultRel(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclMultRel ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclMultRel ");}
    // end arg checking
    var z;
    if (x.negative) {
        if (y.negative) {
            z = pjclMult(x,y);
        }
        else {
            if (y.length != 0) {
                z = pjclMult(x,y);
                z.negative = true;
            }
            else {
                z = [];
            }
        }
    }
    else {
        if (y.negative) {
            if (x.length != 0) {
                z = pjclMult(x,y);
                z.negative = true;
            }            
            else {
                z = [];
            }
        }
        else {
            z = pjclMult(x,y);
        }
    }
    return z
}

export function pjclShortMult(x,y) {
    // begin arg checking 
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclShortMult ");}
    if (!(typeof y == "number")) {throw new Error(" y not a number in pjclShortMult ");}
    if (!(y == Math.floor(y))) {throw new Error(" y not an integer in pjclShortMult ");}
    if (!(y >= 0 && y < pjclBase)) {throw new Error(" y out of range in pjclShortMult ");}
    // end arg checking
    if (y == 0) {
        return [];
    }
    var z = [];
    var i,u,v;
    var carry = 0;
    for (i = 0; i < x.length; i++) {
        u = x[i] * y + carry;
        v = u & pjclBaseMask;
        z[i] = v;
        carry = (u - v) * pjclBaseInv;
    }
    if (carry > 0) {
        z[i] = carry;
    }
    return z;
}

export function pjclSqr_Long(x) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclSqr_Long ");}
    // end arg checking
    var m = x.length;
    if (m == 0) {
        return [];
    }
    var z = [];
    var i,j,k,l,u,v,carry;
    for (i = 0; i < 2 * m; i++) {
        z[i] = 0;
    }
    for (i = j = 0; i < m; i = j) {
        for ( ; j < m && j < i + 16; j++) {
            z[2*j] += Math.pow(x[j],2);
            for (k = j + 1; k < m; k++) {
                z[j+k] += 2 * (x[j] * x[k]);
            }
        }
        carry = 0;
        for (l = 2 * i; l < j + m - 1; l++) {
            u = z[l] + carry;
            v = u & pjclBaseMask;
            z[l] = v;
            carry = (u - v) * pjclBaseInv;
        }    
        z[l] = carry;
    }
    if (z[2 * m - 1] == 0) {
        z.length = 2 * m - 1;
    }
    return z; 
}

// use Meta/KaratsubaThresholds.html to find the optimal threshold for a particular machine 
//
// code comments omitted, see those in pjclMult_Karatsuba
//
export function pjclSqr_Karatsuba(x, threshold = 175 /* 175limbs = 4200 bits */) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclSqr_Karatsuba ");}
    // end arg checking
    var xlength = x.length;
    if (xlength == 0) {
        return [];
    }
    if (xlength <= threshold) {
        return pjclSqr_Long(x);
    }

    var l = Math.ceil(xlength/2);
    var x1 = x.slice(l);
    var x0 = x.slice(0,l);
    var j = x0.length;
    while (j > 0) {
        if (x0[--j] != 0) {
            j++
            break;
        }
    }
    x0.length = j;

    var u = pjclSqr_Karatsuba(x1);
    var x1_x0 = pjclSubRel(x1, x0);
    var v = pjclSqr_Karatsuba(x1_x0);
    var w = pjclSqr_Karatsuba(x0);

    var i;
    
    var z = w.slice(0,l);
    for (i = z.length; i < l; i++) {
        z.push(0);
    }
    
    var carry = 0;
    var a, b;
    for ( ; i < 2*l-1; i++) {
        a = (w[i] || 0) + (w[i-l] || 0) - (v[i-l] || 0) + u[i-l] + carry;
        if (a < 0) {
            z[i] = a + pjclBase;
            carry = -1;
        }
        else if (a >= pjclBase) {
            z[i] = a & pjclBaseMask;
            carry = a >>> pjclBaseBitLength;
        }
        else {
            z[i] = a;
            carry = 0;
        }
    }
    a = (w[i] || 0) + (w[i-l] || 0) - (v[i-l] || 0) + (u[i-l] || 0) + carry;
    if (a < 0) {
        z[i] = a + pjclBase;
        carry = -1;
    }
    else if (a >= pjclBase) {
        z[i] = a & pjclBaseMask;
        carry = a >>> pjclBaseBitLength;
    }
    else {
        z[i] = a;
        carry = 0;
    }
    i++;
            
    for ( ; i < 3*l-1; i++) {
        a = (w[i-l] || 0) - (v[i-l] || 0) + (u[i-l] || 0) + u[i - 2*l] + carry;
        if (a < 0) {
            z[i] = a + pjclBase;
            carry = -1;
        }
        else if (a >= pjclBase) {
            z[i] = a & pjclBaseMask;
            carry = a >>> pjclBaseBitLength;
        }
        else {
            z[i] = a;
            carry = 0;
        }
    }
    a = (w[i-l] || 0) - (v[i-l] || 0) + (u[i-l] || 0) + (u[i - 2*l] || 0) + carry;
    if (a < 0) {
        z[i] = a + pjclBase;
        carry = -1;
    }
    else if (a >= pjclBase) {
        z[i] = a & pjclBaseMask;
        carry = a >>> pjclBaseBitLength;
    }
    else {
        z[i] = a;
        carry = 0;
    }
    i++;
            
    for ( ; i < 2*l + u.length; i++) {
        a = u[i-2*l] + carry;
        if (a < 0) {
            z[i] = a + pjclBase;
            carry = -1;
        }
        else if (a >= pjclBase) {
            z[i] = a - pjclBase;
            carry = 1;
        }
        else {
            z[i] = a;
            carry = 0;
        }
    }
    
    if (carry > 0) {
        z[i] = carry;
    }
    else { 
        while (i > 0) {
            if (z[--i] != 0) {
                i++
                break;
            }
        }
        z.length = i;
    }
    return z;
}

export function pjclShortShiftLeft(x,k) {   
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error("x is not well formed in pjclShortShiftLeft");}
    if (!(typeof k == "number")) {throw new Error("k not a number in pjclShortShiftLeft");}
    if (!(k == Math.floor(k))) {throw new Error("k not an integer in pjclShortShiftLeft");}
    if (!(k >= 0 && k < pjclBaseBitLength)) {throw new Error("k out of range in pjclShortShiftLeft");}
    // end arg checking
    var n = x.length;
    if (n == 0) {
        return;
    }
    var i;
    x[n] = 0;     
    for (i = n; i > 0; i--) {
        x[i] = x[i] | (x[i - 1] >>> (pjclBaseBitLength - k));
        x[i - 1] = (x[i - 1] << k) & pjclBaseMask;
    }
    if (x[n] == 0) {
        x.length = n;
    }
}

export function pjclShiftLeft(x,k) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclShiftLeft ");}
    if (!(typeof k == "number")) {throw new Error(" k not a number in pjclShiftLeft ");}
    if (!(k == Math.floor(k))) {throw new Error(" k not an integer in pjclShiftLeft ");}
    if (k < 0) {throw new Error("k negative in pjclShiftLeft")}
    // end arg checking
    var n = x.length;
    if (n == 0) {
        return;
    }
    var q = Math.floor( k / pjclBaseBitLength);
    var r = k - q * pjclBaseBitLength;
    pjclShortShiftLeft(x,r);
    for (var i = 0; i < q; i++) {
        x.unshift(0);
    }    
}

export function pjclMultByPowerOf2(x,k) {
    x = x.concat();
    pjclShiftLeft(x,k);
    return x;
}

export function pjclShortShiftRight(x,k) {
    // begin arg checking 
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclShortShiftRight ");}
    if (x.negative) {throw new Error(" x negative in pjclShortShiftRight ");} 
    if (!(typeof k == "number")) {throw new Error(" k not a number in pjclShortShiftRight ");}
    if (!(k == Math.floor(k))) {throw new Error(" k not an integer in pjclShortShiftRight ");}
    if (k < 0) {throw new Error(" k negative in pjclShortShiftRight ");}
    if (!(k >= 0 && k < pjclBaseBitLength)) {throw new Error(" k out of range in pjclShortShiftRight ")}
    // end arg checking
    var n = x.length;
    if (n == 0) {
        return;
    }
    for (var i = 0; i + 1 < n; i++) {
        x[i] = x[i] >>> k;
        x[i] = x[i] | ((x[i + 1] << (pjclBaseBitLength - k)) & pjclBaseMask);
    }
    x[n - 1] = x[n - 1] >>> k;
    if (x[n - 1] == 0) {
        x.length = n - 1;    
    }
}

export function pjclShiftRight(x,k) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclShiftRight ");}
    if (x.negative) {throw new Error(" x negative in pjclShiftRight ");}
    if (!(typeof k == "number")) {throw new Error(" k not a number in pjclShiftRight ");}
    if (!(k == Math.floor(k))) {throw new Error(" k not an integer in pjclShiftRight ");}
    if (k < 0) {throw new Error(" k negative in pjclShiftRight ")}
    // end arg checking
    var n = x.length;
    if (n == 0) {
        return;
    }
    var q = Math.floor(k/pjclBaseBitLength);
    var r = k - q * pjclBaseBitLength;
    pjclShortShiftRight(x,r);
    for (var i = 0; i < q; i++) {
        x.shift();
    }    
    if (x.negative && x.length == 0) {
        delete x.negative;
    }
}

export function pjclDivByPowerOf2(x,k) {
    x = x.concat();
    pjclShiftRight(x,k);
    return x;
}

export function pjclDiv(x,y) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclDiv ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclDiv ");}
    if (y.length == 0) {throw new Error(" y is zero (i.e., []) in pjclDiv ");}
    // end arg checking
    x = x.concat();
    y = y.concat();
    var ylength = y.length;
    if (ylength == 1) {
        var o = pjclShortDiv(x,y[0]); 
        if (o.remainder == 0) {
            return {quotient: o.quotient, remainder: []};
        }
        return {quotient: o.quotient, remainder: [o.remainder]};
    }
    if (x.length < ylength) {
        return {quotient: [], remainder: x};
    }
        
    var t = ylength - 1;

    var k;
    if ((y[t] & pjclHalfBase) == 0) {
        var u = y[t];
        k = 0;
        do {
            u <<= 1;
            k++;
        } while ((u & pjclHalfBase) == 0);
        y.length = t;
        // begin arg checking
        try {
        // end arg checking
        pjclShortShiftLeft(y,k);
        // begin arg checking
        }
        catch(e) {
            if (e.message !== "x is not well formed in pjclShortShiftLeft") {
                throw e;
            }
        }
        // end arg checking
        y[t] |= u;
        pjclShortShiftLeft(x,k);
    }
    else {
        k = 0;
    }
    
    var n = x.length - 1; // notice that x.length may have increased
    var i;

    var shiftedDivisor = y.concat();
    for (i = 0; i < n - t; i++) {
        shiftedDivisor.unshift(0);
    }
    var q = [];
    if (pjclGreaterThanOrEqual(x,shiftedDivisor)) {
        x = pjclSub(x,shiftedDivisor);
        q[n - t] = 1;
    } 
    
    for (i = n; i > t; i--) {
        var xi = x[i] || 0;
        var xi_1 = x[i - 1] || 0;
        var x3limbs = x.slice(i - 2); // if x.length <= i - 2, x3limbs is []
        var yt = y[t];
        var yt_1 = y[t - 1];
        var qi_t_1;
        if (x[i] == y[t]) {
            qi_t_1 = pjclBaseMask;
        }
        else {
            qi_t_1 = Math.floor((xi * pjclBase + xi_1)/ yt);
        }
        while (pjclGreaterThan(pjclShortMult([yt_1, yt], qi_t_1), x3limbs)) {
            qi_t_1--;
        }
        shiftedDivisor.shift();
        var subtrahend = pjclShortMult(shiftedDivisor, qi_t_1);
        if (pjclGreaterThan(subtrahend, x)) {
            qi_t_1--;
            subtrahend = pjclSub(subtrahend, shiftedDivisor);
        }
        x = pjclSub(x, subtrahend);
        q[i - t - 1] = qi_t_1;
    }

    if (k > 0) {
        pjclShortShiftRight(x,k);
    }

    var l = x.length; // notice that x.length may have decreased
    while (l > 0) {
        if (x[--l] != 0) {
            l++;
            break;
        }
    }    
    x.length = l;
    return {quotient: q, remainder: x};
}

export function pjclDivRel(x,y) {
    var o = pjclDiv(x,y);
    var q = o.quotient;
    var r = o.remainder;
    if (x.negative) {
        if (r.length != 0) {
            r = pjclSub(y,r);
            q = pjclAdd(q,[1]);
        }
        q.negative = true;    
    } 
    return {quotient: q, remainder: r};
}

export function pjclShortDiv(x,y) {
    // begin arg checking 
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclShortDiv ");}
    if (!(typeof y == "number")) {throw new Error(" y not a number in pjclShortDiv ");}
    if (!(y == Math.floor(y))) {throw new Error(" y not an integer in pjclShortDiv ");}
    if (!(y > 0 && y < pjclBase)) {throw new Error(" y out of range in pjclShortDiv ");}
    // end arg checking
    var q = [];
    var r;
    var xlength = x.length;
    if (xlength == 0) {
        return {quotient: [], remainder: 0}
    }
    var i = xlength - 1;
    if (x[i] < y) {
        r = x[i--];    
    }
    else {
        r = 0;
    }
    while (i >= 0) {
        var shortDividend = r * pjclBase + x[i];
        r = shortDividend % y;      //r must be computed first; see ECMAScript 5.1 Section 11.5.3
        q[i] = (shortDividend - r)/y;
        i--;
    }
    return {quotient: q, remainder: r};
}

export function pjclMod(x,m) {
    // begin arg checking
    if (m.negative) {throw new Error(" m negative in pjclMod ");}
    // other arg checking done below by pjclDiv
    // end arg checking
    var o = pjclDiv(x,m);
    var r = o.remainder;
    if (x.negative && r.length != 0) {
        return pjclSub(m,r);
    }
    else {
        return r;
    }
}
            
export function pjclTruncate(x,t) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclTruncate ");}
    if (x.negative) {throw new Error(" x negative in pjclTruncate ");}
    if (!(typeof t == "number")) {throw new Error(" t not a number in pjclTruncate ");}
    if (!(t == Math.floor(t))) {throw new Error(" t not an integer in pjclTruncate ");}
    if (!(t > 0)) {throw new Error(" t out of range in pjclTruncate ");}
    // end arg checking    
    var f = t/pjclBaseBitLength;
    var l = Math.ceil(f);
    if (x.length < l) {
        return;
    }
    x.length = l;
    var i = Math.floor(f);
    var y = t - i * pjclBaseBitLength;
    if (y != 0) {
        var z = 0xffffffff >>> (32 - y);
        x[i] = x[i] & z;
    }
    while (l > 0) {
        if (x[--l] != 0) {
            l++;
            break;
        }
    }    
    x.length = l;
}

export function pjclModPowerof2(x,t) {
    x = x.concat();
    pjclTruncate(x,t);
    return x;
}

export function pjclModLimb(x,m) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclModLimb ");}
    if (x.negative) {throw new Error(" x negative in pjclModLimb ");}
    if (!(typeof m == "number")) {throw new Error(" m not a number in pjclModLimb ");}
    if (!(m == Math.floor(m))) {throw new Error(" m not an integer in pjclModLimb ");}
    if (!(m > 0 && m < pjclBase)) {throw new Error(" m out of range in pjclModLimb ");}
    // end arg checking
    var o = pjclShortDiv(x,m);
    return o.remainder;
}

export function pjclEGCD(a,b,computeBothBezoutCoeffs) {
    // begin arg checking
    if (!pjclWellFormed(a)) {throw new Error(" a not well formed in pjclEGCD ");}
    if (a.negative) {throw new Error(" a negative in pjclEGCD ");}
    if (!pjclWellFormed(b)) {throw new Error(" b not well formed in pjclEGCD ");}
    if (b.negative) {throw new Error(" b negative in pjclEGCD ");}
    // end arg checking
    if (b.length == 0) {
        return {gcd: a, x: [1], y: []};
    }
    var r0 = a;
    var r1 = b;
    var s0 = [1];
    var s1 = [];
    var o;
    while (r1.length != 0) {
        o = pjclDiv(r0,r1);
        var q = o.quotient;
        var r = o.remainder;
        
        var qs1 = pjclMult(q,s1);
        var z = qs1;
        if (s1.negative) {
            delete z.negative;
        }
        else if (s1.length > 0) {
            z.negative = true;
        }
        var x = pjclAddRel(s0,z);
                
        r0 = r1;
        r1 = r; 
        s0 = s1;
        s1 = x;
    }
    if (computeBothBezoutCoeffs) {
        var ax = pjclMult(a, s0);
        if (!s0.negative) {
            ax.negative = true;
        }
        else {
            delete ax.negative;
        }
        var by = pjclAddRel(r0,ax);
        o = pjclDiv(by,b);
        var y = o.quotient;
        if (by.negative) {
            y.negative = true;
        }
        return {gcd: r0, x: s0, y: y};
    }
    else {
        return {gcd: r0, x: s0};
    }
}

export function pjclModInv(a,m) {
    // begin arg checking
    if (m.length == 0) {throw new Error(" m is zero in pjclModInv ");}
    // other arg checking done below by pjclEGCD
    // end arg checking 
    var o = pjclEGCD(a,m);
    var gcd = o.gcd;
    if (gcd.length != 1 || gcd[0] != 1) {
        return;
    }
    return pjclMod(o.x,m);
} 

export function pjclPreMontRed(m) {
    // begin arg checking
    if (!pjclWellFormed(m)) {throw new Error(" m not well formed in pjclPreMontRed ");}
    if (m.negative) {throw new Error(" m negative in pjclPreMontRed ");}
    if (!(m[0] & 1)) {throw new Error(" m even in pjclPreMontRed ");}
    if (m.length < 2) {throw new Error(" m must have at least two limbs in pjclPreMontRed ");}
    // end arg checking
    var m0 = m[0];
    if ((m0 & 1) != 1) {
        throw new Error("m is not odd");
    } 
    var r0 = pjclBase;
    var r1 = m0;
    var t0 = 0;
    var t1 = 1;
    var y;
    while (r1 != 0) {
        var r = r0 % r1;
        var q = (r0 - r) / r1;
        
        y = t0 - (q * t1);
        r0 = r1;
        r1 = r; 
        t0 = t1;
        t1 = y;
    }
    var m1;    
    if (t0 < 0) {
        m1 = (-t0) & pjclBaseMask;
    }
    else {
        m1 = (pjclBase - (t0 & pjclBaseMask)); 
    }
    return m1;
}

export function pjclMontRed(t,m,m1) {
    // begin arg checking
    if (!pjclWellFormed(t)) {throw new Error(" t not well formed in pjclMontRed ");}
    if (t.negative) {throw new Error(" t negative in pjclMontRed ");}
    if (!pjclWellFormed(m)) {throw new Error(" m not well formed in pjclMontRed ");}
    if (m.negative) {throw new Error(" m negative in pjclMontRed ");}    
    if (m.length < 2) {throw new Error(" m must have at least two limbs in pjclMontRed ");}
    if ((m[0] & 1) == 0) {throw new Error(" m even in pjclMontRed ");}
    if (!(typeof m1 == "number")) {throw new Error(" m1 not a number in pjclMontRed ");}
    if (!(m1 == Math.floor(m1))) {throw new Error(" m1 not an integer in pjclMontRed ");}
    if (!(m1 > 0 && m1 < pjclBase)) {throw new Error(" m1 out of range in pjclMontRed ");}
    var mR = m.concat();
    for (var ii = 0; ii < m.length; ii++) {
        mR.unshift(0);        
    }
    if (pjclGreaterThanOrEqual(t,mR)) {
        throw new Error("t >= mR in pjclMontRed")
    }
    // end arg checking
    var n = m.length;
    var a = t.concat();
    var i,j,k,l,u,v,w,carry;
    for (i = a.length; i <= 2 * n + 1; i++) {
        a[i] = 0;
    }
    i = 0;
    while (i < n) {
        u = (a[i] * m1) & pjclBaseMask;
        // case:  k = 0:
        v = a[i] + u * m[0];
        // w = v & pjclBaseMask;
        // a[i] = w; 
        // but w must be 0
        a[i] = 0;
        carry = v * pjclBaseInv;
        // case: k = 1;
        v = carry + a[i + 1] + u * m[1];
        w = v & pjclBaseMask;
        
        a[i + 1] = w;
        carry = (v - w) * pjclBaseInv;
        
        a[i + 2] += carry;
        // case: k >=2;            
        for (k = 2; k < n; k++) {
            a[k + i] += u * m[k];    
        }
        i++;
        if ((i & 0x1F) == 0) {
            carry = 0;
            for (l = i + 1; l < i + n; l++) {
                v = a[l] + carry;
                w = v & pjclBaseMask;
                a[l] = w;
                carry = (v - w) * pjclBaseInv;
            }
            if (i < n) {
                a[l] += carry;
            }
        }
    }
    
    if ((i & 0x1F) != 0) {
        carry = 0;
        for (l = i + 1; l < i + n; l++) {
            v = a[l] + carry;
            w = v & pjclBaseMask;
            a[l] = w;
            carry = (v - w) * pjclBaseInv;
        }
    }    
        
    while (carry) { 
        v = a[l] + carry;
        if (v <= pjclBase) {
            carry = 0;
            a[l] = v;
        }
        else {
            carry = 1;
            a[l] = v - pjclBase;
        }
        l++;
    }
    
    a.splice(0,n);
    
    var l = a.length;
    while (l > 0) {
        if (a[--l] != 0) {
            l++
            break;
        }
    }    
    a.length = l;

    if (pjclGreaterThanOrEqual(a,m)) {
        a = pjclSub(a,m);
    }
    return a;
}

export function pjclOptimalWindowSize(l) {
    // begin arg checking
    if (!(typeof l == "number")) {throw new Error(" l not a number in pjclOptimalWindowSize ");}
    if (!(l == Math.floor(l))) {throw new Error(" l not an integer in pjclOptimalWindowSize ");}
    if (!(l > 0)) {throw new Error(" l must be positive in pjclOptimalWindowSize ");} 
    // end arg checking
    if (l < 25) {
        return 2;
    }
    else if (l < 81) {
        return 3;
    }
    else if (l < 241) {
        return 4;
    }
    else if (l < 673) {
        return 5;
    }
    else if (l < 1793) {
        return 6;
    }
    else if (l < 4609) {
        return 7;
    }
    else if (l < 11521) {
        return 8;
    }
    else if (l < 28161) {
        return 9;
    }
    else {
        return 10;
    }    
}
    
export function pjclPreExp(slidingWindowSize,context) {
    // begin arg checking
    if (!(typeof slidingWindowSize == "number")) {throw new Error(" slidingWindowSize not a number in pjclPreExp ");}
    if (!(slidingWindowSize == Math.floor(slidingWindowSize))) {throw new Error(" slidingWindowSize not an integer in pjclPreExp ");}
    if (!(slidingWindowSize > 0)) {throw new Error(" slidingWindowSize not positive in pjclPreExp ");} 
    // end arg checking
    context.slidingWindowSize = slidingWindowSize;
    var g = context.g;
    var g2 = context.sqr(g,context);
    context.preComputed = [];
    var x = g;
    context.preComputed[0] = x;
    for (var i = 1; i < (1 << (slidingWindowSize - 1)); i++) {
        x = context.mult(x,g2,context);
        context.preComputed[i] = x;    
    } 
}

export function pjclExp(exponent,context) {
    // begin arg checking
    if (!pjclWellFormed(exponent)) {throw new Error(" exponent not well formed in pjclExp ");}
    if (exponent.negative) {throw new Error(" exponent negative in pjclExp ");}    
    if (exponent.length == 0) {throw new Error(" exponent must be positive in pjclExp ");}
    // end arg checking
    var preComputed = context.preComputed;
    var mult = context.mult;
    var sqr = context.sqr;
    var e = [];
    for (var i = 0; i < exponent.length; i++ ) {
        var d = exponent[i];
        for (var j = 0; j < pjclBaseBitLength; j++) {
            e[(i * pjclBaseBitLength) + j] = d & 1;
            d = d >>> 1;
        }
    }    
    var l = e.length;
    while (l > 0) {
        if (e[--l] != 0) {
            l++;        
            break;
        }
    }
    e.length = l;
                
    var k = context.slidingWindowSize;

    var i = l - 1;
    var j;
    //
    // begin: computing index into preComputed array, for first window; code repeated below
    //
    j = Math.max(i - (k - 1),0);
    while (e[j] == 0) {
        j++;
    }
    var u = 1;
    var v = 0;
    for (var h = j + 1; h <= i; h++) { // starting at j+1 because only odd exponents in preComputed
        if (e[h] == 1) {
            v += u; 
        }
        u = (u << 1);    
    }
    //
    // end: computing index into preComputed array
    //
    var a = preComputed[v];
    i = j - 1;
    while (i >= 0) {
        if (e[i] == 0) {
            a = sqr(a,context);
            i--; 
        }
        else {
            //
            // begin: computing index into preComputed array; same code as above
            //
            j = Math.max(i - (k - 1),0);
            while (e[j] == 0) {
                j++;
            }
            var u = 1;
            var v = 0;
            for (var h = j + 1; h <= i; h++) {
                if (e[h] == 1) {
                    v += u; 
                }
                u = (u << 1);    
            }
            //
            // end: computing index into preComputed array
            //
            for (var h = 0; h < i - j + 1; h++) {
                a = sqr(a,context);
            }
            a = mult(a,preComputed[v],context);
            i = j - 1;
        }            
    }
    return a;    
}

export function pjclPlainExp(g,x) {
    if (x.length == 0) {
        return [1];
    }
    var context = new Object();
    context.g = g;
    context.sqr = pjclSqr;
    context.mult = pjclMult;
    var slidingWindowSize = pjclOptimalWindowSize(pjclBitLengthOfBigInt(x));
    pjclPreExp(slidingWindowSize,context);
    var a = pjclExp(x,context);
    return a;
}
    
export function pjclContextualModMult(x,y,context) {
    var u = pjclMult(x,y);
    var v = pjclMod(u,context.m);
    return v;
}

export function pjclContextualModSqr(x,context) {
    var u = pjclSqr(x);
    var v = pjclMod(u,context.m);
    return v;
}

export function pjclPreModExp(g,m) {
    var context = new Object();
    context.g = pjclMod(g,m);
    context.m = m;
    context.sqr = pjclContextualModSqr;
    context.mult = pjclContextualModMult;
    return context;
}

export function pjclModExp(g,x,m) {
    if (x.length == 0) {
        return [1];
    }
    var context = pjclPreModExp(g,m);
    var slidingWindowSize = pjclOptimalWindowSize(pjclBitLengthOfBigInt(x));
    pjclPreExp(slidingWindowSize,context);
    var a = pjclExp(x,context);
    return a;
}

export function pjclContextualMontMult(x,y,context) {
    return pjclMontRed(pjclMult(x,y),context.m,context.m1);
}

export function pjclContextualMontSqr(x,context) {
    var u = pjclSqr(x);
    var v = pjclMontRed(u,context.m,context.m1);
    return v;
}

export function pjclPre1MontExp(m) {
    var context = new Object();
    context.m = m;
    context.m1 = pjclPreMontRed(m);
    var r2 = [];
    for (var i = 0; i < (2 * m.length); i++) {
        r2.push(0);
    }
    r2.push(1);    
    context.r2modm = pjclMod(r2,m);
    context.sqr = pjclContextualMontSqr;
    context.mult = pjclContextualMontMult;
    return context;
}

export function pjclPre2MontExp(g,context) {
    if (g.length > context.m.length) {
        g = pjclMod(g,context.m);
    }
    var gr2modm = pjclMult(g,context.r2modm);
    context.g = pjclMontRed(gr2modm,context.m,context.m1);
}

export function pjclPostMontExp(a,context) {
    var v = pjclMontRed(a,context.m,context.m1);
    return v;
}

export function pjclMontExp(g,x,m) {
    // begin arg checking
    if (!pjclWellFormed(g)) {throw new Error(" g not well formed in pjclMontExp ");}
    if (g.negative) {throw new Error(" g negative in pjclMontExp ");}
    if (!pjclWellFormed(x)) {throw new Error(" x not well formed in pjclMontExp ");}
    if (x.negative) {throw new Error(" x negative in pjclMontExp ");}
    if (!pjclWellFormed(m)) {throw new Error(" m not well formed in pjclMontExp ");}
    if (m.negative) {throw new Error(" m negative in pjclMontExp ");}
    if (m.length < 2) {throw new Error(" m must have at least two limbs in pjclMontExp ");}
    if ((m[0] & 1) == 0) {throw new Error(" m even in pjclMontExp ");}
    // end arg checking    
    if (x.length == 0) {
        return [1];
    }
    var context = pjclPre1MontExp(m);
    pjclPre2MontExp(g,context);
    var slidingWindowSize = pjclOptimalWindowSize(pjclBitLengthOfBigInt(x));
    pjclPreExp(slidingWindowSize,context);
    var a = pjclExp(x,context);
    return pjclPostMontExp(a,context);    
}

export function pjclOptimalWindowSize2(l) {
    // begin arg checking
    if (!(typeof l == "number")) {throw new Error(" l not a number in pjclOptimalWindowSize2 ");}
    if (!(l == Math.floor(l))) {throw new Error(" l not an integer in pjclOptimalWindowSize2 ");}
    if (!(l > 0)) {throw new Error(" l must be positive in pjclOptimalWindowSize2 ");} 
    // end arg checking    
    if (l < 374) {
        return 2;
    }
    else if (l < 2774) {
        return 3;
    }
    else if (l < 17750) {
        return 4;
    }
    else {
        return 5;
    }
}

export function pjclPreExp2(slidingWindowSize,context) {
    // begin arg checking
    if (!(typeof slidingWindowSize == "number")) {throw new Error(" slidingWindowSize not a number in pjclPreExp2 ");}
    if (!(slidingWindowSize == Math.floor(slidingWindowSize))) {throw new Error(" slidingWindowSize not an integer in pjclPreExp2 ");}
    if (!(slidingWindowSize > 0)) {throw new Error(" slidingWindowSize not positive in pjclPreExp2 ");} 
    // end arg checking
    var mult = context.mult;
    var sqr = context.sqr;
    var l = 1 << slidingWindowSize;
    var preComputed = [];
    preComputed[0] = []; // preComputed[0][0] will be left undefined
    //
    // computing preComputed[0][i] using context.g;
    // see similar code for preComputed[j][0] using context.y
    //
    var firstIndex = 1;
    var firstVal = context.g;
    while (true) {
        preComputed[0][firstIndex] = firstVal;
        var indexIncrement = firstIndex << 1;
        if (indexIncrement >= l) { // firstIndex + indexIncrement >= l implies indexIncrement >= l
            break;
        }
        var valIncrement = sqr(firstVal,context);
        var i = firstIndex;
        var val = firstVal;
        while ((i += indexIncrement) < l) {
            val = mult(val, valIncrement, context);
            preComputed[0][i] = val;
        } 
        firstIndex = indexIncrement;
        firstVal = valIncrement;
    }
    //
    // now similarly computing preComputed[j][0] using context.y;
    //
    var firstIndex = 1;
    var y = context.y;
    var firstVal = y; 
    while (true) {
        preComputed[firstIndex] = [firstVal];
        var indexIncrement = firstIndex << 1;
        if (indexIncrement >= l) { // firstIndex + indexIncrement >= l implies indexIncrement >= l
            break;
        }
        var valIncrement = sqr(firstVal,context);
        var i = firstIndex;
        var val = firstVal;
        while ((i += indexIncrement) < l) {
            val = mult(val, valIncrement, context);
            preComputed[i] = [val];
        }
        firstIndex = indexIncrement;
        firstVal = valIncrement;
    }
    // now filling out the matrix
    for (var j = 1; j < l; j++) {
        for (var i = 1; i < l; i++) {
            preComputed[j][i] = mult(y,preComputed[j-1][i],context);
        }
    }
    context.preComputed = preComputed;
    context.slidingWindowSize = slidingWindowSize;
}

export function pjclExp2(exponentG,exponentY,context) {
    // begin arg checking
    if (!pjclWellFormed(exponentG)) {throw new Error(" exponentG not well formed in pjclExp2 ");}
    if (exponentG.negative) {throw new Error(" exponentG negative in pjclExp2 ");}
    if (!pjclWellFormed(exponentY)) {throw new Error(" exponentY not well formed in pjclExp2 ");}
    if (exponentY.negative) {throw new Error(" exponentY negative in pjclExp2 ");}    
    if (exponentG.length == 0 && exponentY.length == 0) {throw new Error(" both exponents cannot be zero in pjclExp2 ");}
    // end arg checking
    var preComputed = context.preComputed;
    var mult = context.mult;
    var sqr = context.sqr;
    var e1 = pjclBigInt2BitArray(exponentG);
    var e2 = pjclBigInt2BitArray(exponentY);
    var e1length = e1.length;
    var e2length = e2.length;
    if (e1length > e2length) {
        for (var i = 0; i < e1length - e2length; i++) {
            e2.unshift(0);
        }
    }
    else if (e2length > e1length) {
        for (var i = 0; i < e2length - e1length; i++) {
            e1.unshift(0);
        }
    }
    var commonLength = e1.length;
    var k = context.slidingWindowSize;
    var i = 0;
    //
    // begin: computing indices into preComputed array of arrays, for first window; code repeated below
    //
    var j = Math.min((i + k - 1), commonLength - 1);
    var v1 = 0;
    var v2 = 0;
    for (var h = i; h <= j; h++) {
        var u = (1 << (j - h));
        if (e1[h] == 1) {
            v1 += u;
        }
        if (e2[h] == 1) {
            v2 += u;
        }
    }     
    //
    // end: computing indices into preComputed array of arrays
    //
    var a = preComputed[v2][v1];
    i = j + 1;
    while (i < commonLength) {
        if (e1[i] == 0 && e2[i] == 0) {
            a = sqr(a,context);
            i++; 
        }
        else {
            //
            // begin: computing indices into preComputed array of arrays; same code as above
            //
            j = Math.min((i + k - 1), commonLength - 1);
            var v1 = 0;
            var v2 = 0;
            for (var h = i; h <= j; h++) {
                var u = (1 << (j - h));
                if (e1[h] == 1) {
                    v1 += u;
                }
                if (e2[h] == 1) {
                    v2 += u;
                }
            }     
            //
            // end: computing indices into preComputed array of arrays
            //
            for (h = 0; h <= j - i; h++) {
                a = sqr(a,context);
            }
            a = mult(a,preComputed[v2][v1],context);
            i = j + 1;
        }
    }
    return a;
}

export function pjclPre2MontExp2(g,y,context) {
    if (g.length > context.m.length) {
        g = pjclMod(g,context.m);
    }
    var gr2modm = pjclMult(g,context.r2modm);
    context.g = pjclMontRed(gr2modm,context.m,context.m1);
    if (y.length > context.m.length) {
        y = pjclMod(y,context.m);
    }
    var yr2modm = pjclMult(y,context.r2modm);
    context.y = pjclMontRed(yr2modm,context.m,context.m1);
}

export function pjclMontExp2(g,y,exponentG,exponentY,m) {
    // begin arg checking
    if (!pjclWellFormed(g)) {throw new Error(" g not well formed in pjclMontExp2 ");}
    if (g.negative) {throw new Error(" g negative in pjclMontExp2 ");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclMontExp2 ");}
    if (y.negative) {throw new Error(" y negative in pjclMontExp2 ");}
    if (!pjclWellFormed(exponentG)) {throw new Error(" exponentG not well formed in pjclMontExp2 ");}
    if (exponentG.negative) {throw new Error(" exponentG negative in pjclMontExp2 ");}    
    if (!pjclWellFormed(exponentY)) {throw new Error(" exponentY not well formed in pjclMontExp2 ");}
    if (exponentY.negative) {throw new Error(" exponentY negative in pjclMontExp2 ");}
    if (!pjclWellFormed(m)) {throw new Error(" m not well formed in pjclMontExp2 ");}
    if (m.negative) {throw new Error(" m negative in pjclMontExp2 ");}
    if (m.length < 2) {throw new Error(" m must have at least two limbs in pjclMontExp2 ");}
    if ((m[0] & 1) == 0) {throw new Error(" m even in pjclMontExp2 ");}
    // end arg checking        
    if (exponentG.length == 0 && exponentY.length == 0) {
        return [1];
    }
    var context = pjclPre1MontExp(m);
    pjclPre2MontExp2(g,y,context);
    var slidingWindowSize = pjclOptimalWindowSize2(Math.max(pjclBitLengthOfBigInt(exponentG),pjclBitLengthOfBigInt(exponentY)));
    pjclPreExp2(slidingWindowSize,context);
    var a = pjclExp2(exponentG,exponentY,context);
    return pjclPostMontExp(a,context);    
}

const pjclSHA256IV = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
const pjclSHA384IV = [
    0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507,    
    0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511,
    0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4
    ];

export function pjclSHA256Core(bitArray,IV) {
    var H0 = IV[0];
    var H1 = IV[1];
    var H2 = IV[2];
    var H3 = IV[3];
    var H4 = IV[4];
    var H5 = IV[5];
    var H6 = IV[6];
    var H7 = IV[7];
    var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    var bitPos,t,a,b,c,d,e,f,g,h,T1,T2;
    var w = [];
    var i = 0;
    while(i < bitArray.length) {
        for (t = 0; t < 16; t++) {
            w[t] = 0;
            for (bitPos = 31; bitPos >= 0; i++,bitPos--) {
                w[t] = (bitArray[i] << bitPos) | w[t];
            }
        }
        for (t = 16; t < 64; t++) {
            w[t] = ((((w[t - 2] >>> 17) | (w[t - 2] << 15)) ^ ((w[t - 2] >>> 19 ) | (w[t - 2] << 13)) ^ (w[t - 2] >>> 10)) + w[t - 7] + (((w[t - 15] >>> 7) | (w[t - 15] << 25)) ^ ((w[t - 15] >>> 18) | (w[t-15] << 14)) ^ (w[t - 15] >>> 3)) + w[t - 16]) | 0;
        }
        a = H0;
        b = H1; 
        c = H2;
        d = H3;
        e = H4;
        f = H5;
        g = H6;
        h = H7;
        for (t = 0; t < 64; t++) {
            T1 = (h + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g)) + K[t] + w[t]);
            T2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & b) ^ (a & c) ^ (b & c)));
            h = g;
            g = f;
            f = e; 
            e = (d + T1);
            d = c;
            c = b;
            b = a;
            a = (T1 + T2);
        }
    H0 = (a + H0) | 0;
    H1 = (b + H1) | 0;
    H2 = (c + H2) | 0;
    H3 = (d + H3) | 0;
    H4 = (e + H4) | 0;
    H5 = (f + H5) | 0;
    H6 = (g + H6) | 0;
    H7 = (h + H7) | 0;
    }        
    var x = [H0,H1,H2,H3,H4,H5,H6,H7];
    return x;
}    

export function pjclPadTo512(bitArray,lenTag) {
    const l = bitArray.length;
    lenTag = lenTag || l;
    var m = bitArray.concat();
    var h = (Math.ceil((l + 65) / 512)) * 512;
    var k = h - (l + 65);
    m.push(1);
    for (var i = 0; i < k + 32; i++) {
        m.push(0);
    }
    var u,v;
    for (u = 0x80000000, v = 31; v >= 0; (u = u >>> 1),v--) {
        m.push((lenTag & u) >>> v);
    }
    return m;
}

export function pjclPadTo1024(bitArray,lenTag) {
    const l = bitArray.length;
    lenTag = lenTag || l;
    var m = bitArray.concat();
    var h = (Math.ceil((l + 129) / 1024)) * 1024;
    var k = h - (l + 129);
    m.push(1);
    for (var i = 0; i < k + 96; i++) {
        m.push(0);
    }
    var u,v;
    for (u = 0x80000000, v = 31; v >= 0; (u = u >>> 1),v--) {
        m.push((lenTag & u) >>> v);
    }
    return m;
}

export function pjclSHA512Core(bitArray,IV) {
    var    H01 = IV[0];
    var    H02 = IV[1];
    var    H11 = IV[2];
    var    H12 = IV[3];
    var    H21 = IV[4];
    var    H22 = IV[5];
    var    H31 = IV[6];
    var    H32 = IV[7];
    var    H41 = IV[8];
    var    H42 = IV[9];
    var    H51 = IV[10];
    var    H52 = IV[11];
    var    H61 = IV[12];
    var    H62 = IV[13];
    var    H71 = IV[14];
    var    H72 = IV[15];
    var K1 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    0xca273ece, 0xd186b8c7, 0xeada7dd6, 0xf57d4f7f, 0x06f067aa, 0x0a637dc5, 0x113f9804, 0x1b710b35,
    0x28db77f5, 0x32caab7b, 0x3c9ebe0a, 0x431d67c4, 0x4cc5d4be, 0x597f299c, 0x5fcb6fab, 0x6c44198c
    ];
    var K2 = [ 
    0xd728ae22, 0x23ef65cd, 0xec4d3b2f, 0x8189dbbc, 0xf348b538, 0xb605d019, 0xaf194f9b, 0xda6d8118,
    0xa3030242, 0x45706fbe, 0x4ee4b28c, 0xd5ffb4e2, 0xf27b896f, 0x3b1696b1, 0x25c71235, 0xcf692694,
    0x9ef14ad2, 0x384f25e3, 0x8b8cd5b5, 0x77ac9c65, 0x592b0275, 0x6ea6e483, 0xbd41fbd4, 0x831153b5,
    0xee66dfab, 0x2db43210, 0x98fb213f, 0xbeef0ee4, 0x3da88fc2, 0x930aa725, 0xe003826f, 0x0a0e6e70,
    0x46d22ffc, 0x5c26c926, 0x5ac42aed, 0x9d95b3df, 0x8baf63de, 0x3c77b2a8, 0x47edaee6, 0x1482353b,
    0x4cf10364, 0xbc423001, 0xd0f89791, 0x0654be30, 0xd6ef5218, 0x5565a910, 0x5771202a, 0x32bbd1b8,
    0xb8d2d0c8, 0x5141ab53, 0xdf8eeb99, 0xe19b48a8, 0xc5c95a63, 0xe3418acb, 0x7763e373, 0xd6b2b8a3,
    0x5defb2fc, 0x43172f60, 0xa1f0ab72, 0x1a6439ec, 0x23631e28, 0xde82bde9, 0xb2c67915, 0xe372532b,
    0xea26619c, 0x21c0c207, 0xcde0eb1e, 0xee6ed178, 0x72176fba, 0xa2c898a6, 0xbef90dae, 0x131c471b,
    0x23047d84, 0x40c72493, 0x15c9bebc, 0x9c100d4c, 0xcb3e42b6, 0xfc657e2a, 0x3ad6faec, 0x4a475817
    ];
    var bitPos,t,j,a1,a2,b1,b2,c1,c2,d1,d2,e1,e2,f1,f2,g1,g2,h1,h2,T11,T12,T21,T22;
    var w1 = [];
    var w2 = [];
    var i = 0;
    while(i < bitArray.length) {
        for (t = 0; t < 16; t++) {
            w1[t] = 0;
            w2[t] = 0;
            j = i + 32;
            for (bitPos = 31; bitPos >= 0; i++,j++,bitPos--) {
                w1[t] = (bitArray[i] << bitPos) | w1[t];
                w2[t] = (bitArray[j] << bitPos) | w2[t];
            }
            i = j;
        }
        for (t = 16; t < 80; t++) {
            var x1 = ((w2[t - 2] << 13) | (w1[t - 2] >>> 19)) ^ ((w2[t - 2] >>> 29) | (w1[t - 2] << 3)) ^ (w1[t - 2] >>> 6);  
            var x2 = ((w1[t - 2] << 13) | (w2[t - 2] >>> 19)) ^ ((w1[t - 2] >>> 29) | (w2[t - 2] << 3)) ^ ((w1[t - 2] << 26) | (w2[t - 2] >>> 6));
            var y1 = ((w2[t - 15] << 31) | (w1[t - 15] >>> 1)) ^ ((w2[t - 15] << 24) | (w1[t - 15] >>> 8)) ^ (w1[t - 15] >>> 7);    
            var y2 = ((w1[t - 15] << 31) | (w2[t - 15] >>> 1)) ^ ((w1[t - 15] << 24) | (w2[t - 15] >>> 8)) ^ ((w1[t - 15] << 25) | (w2[t - 15] >>> 7));
            var o = pjclAdd64Bits(y1,y2,w1[t - 16],w2[t - 16]);
            o = pjclAdd64Bits(w1[t - 7],w2[t - 7],o.upper,o.lower);
            o = pjclAdd64Bits(x1,x2,o.upper,o.lower);
            w1[t] = o.upper;
            w2[t] = o.lower;
        }
        a1 = H01;
        a2 = H02;
        b1 = H11;
        b2 = H12; 
        c1 = H21;
        c2 = H22;
        d1 = H31;
        d2 = H32;
        e1 = H41;
        e2 = H42;
        f1 = H51;
        f2 = H52;
        g1 = H61;
        g2 = H62;
        h1 = H71;
        h2 = H72;
        for (t = 0; t < 80; t++) {
            var x1 = ((e2 << 18) | (e1 >>> 14)) ^ ((e2 << 14) | (e1 >>> 18)) ^ ((e2 >>> 9) | (e1 << 23));
            var x2 = ((e1 << 18) | (e2 >>> 14)) ^ ((e1 << 14) | (e2 >>> 18)) ^ ((e1 >>> 9) | (e2 << 23));
            var y1 = (e1 & f1) ^ (~e1 & g1); //(e & f) ^ (~e & g)
            var y2 = (e2 & f2) ^ (~e2 & g2);
            var o = pjclAdd64Bits(K1[t],K2[t],w1[t],w2[t]);
            o = pjclAdd64Bits(y1,y2,o.upper,o.lower);
            o = pjclAdd64Bits(x1,x2,o.upper,o.lower);
            o = pjclAdd64Bits(h1,h2,o.upper,o.lower);
            T11 = o.upper;
            T12 = o.lower;                                               //h1 + x1 + y1 + K1[t] + w1[t]
            var s1 = ((a2 << 4) | (a1 >>> 28)) ^ ((a2 >>> 2) | (a1 << 30)) ^ ((a2 >>> 7) | (a1 << 25));  
            var s2 = ((a1 << 4) | (a2 >>> 28)) ^ ((a1 >>> 2) | (a2 << 30)) ^ ((a1 >>> 7) | (a2 << 25));
            var m1 = ((a1 & b1) ^ (a1 & c1) ^ (b1 & c1)); //((a & b) ^ (a & c) ^ (b & c))
            var m2 = ((a2 & b2) ^ (a2 & c2) ^ (b2 & c2));
            var o = pjclAdd64Bits(s1,s2,m1,m2);  //s1 + m1                                                
            T21 = o.upper;
            T22 = o.lower;
            h1 = g1;
            h2 = g2;
            g1 = f1;
            g2 = f2;
            f1 = e1;
            f2 = e2;
            var o = pjclAdd64Bits(d1,d2,T11,T12);      // d + T1
            e1 = o.upper;
            e2 = o.lower;
            d1 = c1;
            d2 = c2;
            c1 = b1;
            c2 = b2;
            b1 = a1;
            b2 = a2;
            var o = pjclAdd64Bits(T11,T12,T21,T22);  // T1 + T2
            a1 = o.upper;     
            a2 = o.lower;
        }
        var nHash = pjclAdd64Bits(H01,H02,a1,a2);//H01 = (a1 + H01) | 0 
        H01 = nHash.upper;
        H02 = nHash.lower;
        var nHash = pjclAdd64Bits(H11,H12,b1,b2);
        H11 = nHash.upper;
        H12 = nHash.lower; 
        var nHash = pjclAdd64Bits(H21,H22,c1,c2);
        H21 = nHash.upper;
        H22 = nHash.lower;
        var nHash = pjclAdd64Bits(H31,H32,d1,d2);
        H31 = nHash.upper;
        H32 = nHash.lower;
        var nHash = pjclAdd64Bits(H41,H42,e1,e2);
        H41 = nHash.upper;
        H42 = nHash.lower;
        var nHash = pjclAdd64Bits(H51,H52,f1,f2);
        H51 = nHash.upper;
        H52 = nHash.lower;
        var nHash = pjclAdd64Bits(H61,H62,g1,g2);
        H61 = nHash.upper;
        H62 = nHash.lower;
        var nHash = pjclAdd64Bits(H71,H72,h1,h2);
        H71 = nHash.upper;
        H72 = nHash.lower; 
    }
    var x = [H01,H02,H11,H12,H21,H22,H31,H32,H41,H42,H51,H52,H61,H62,H71,H72];
    return x;    
}

export function pjclAdd64Bits(upper1,lower1,upper2,lower2) {
    var lower1p;
    var lower2p;
    var carry;
    lower1p = (lower1 < 0) ? (lower1 + 0x100000000): lower1;
    lower2p = (lower2 < 0) ? (lower2 + 0x100000000): lower2;
    var lower = lower1p + lower2p;
    if (lower >= 0x100000000) {
        carry = 1;
    }
    else {
        carry = 0;
    }
    lower |= 0;
    var upper = (upper1 + upper2 + carry) | 0;
    return {upper: upper, lower: lower};
}
            
export function pjclSHA256(bitArray) {
    // begin arg checking
    if (!(pjclIsBitArray(bitArray))) {throw new Error(" bitArray not a bit array in pjclSHA256 ");}
    // end arg checking
    var m = pjclPadTo512(bitArray);
    var u = pjclSHA256Core(m,pjclSHA256IV);
    return pjclUI32Array2BitArray(u);
}

export function pjclSHA384(bitArray) {
    // begin arg checking
    if (!(pjclIsBitArray(bitArray))) {throw new Error(" bitArray not a bit array in pjclSHA384 ");}
    // end arg checking
    var m = pjclPadTo1024(bitArray);
    var u = pjclSHA512Core(m,pjclSHA384IV);
    u.length = 12;
    return pjclUI32Array2BitArray(u);
}

var pjclIpad512 = [];
var pjclOpad512 = [];
for (var pjcl_i = 0; pjcl_i < 64; pjcl_i++) {
     pjclIpad512 = pjclIpad512.concat([0,0,1,1,0,1,1,0]);
     pjclOpad512 = pjclOpad512.concat([0,1,0,1,1,1,0,0]);
}

var pjclIpad1024 = [];
var pjclOpad1024 = [];
for (var pjcl_i = 0; pjcl_i < 128; pjcl_i++) {
     pjclIpad1024 = pjclIpad1024.concat([0,0,1,1,0,1,1,0]);
     pjclOpad1024 = pjclOpad1024.concat([0,1,0,1,1,1,0,0]);
}

export function pjclHMAC_SHA256XorWithPad(pad,key) {
    var o = [];
    for (var i = 0; i < 512; i++) {
        o[i] = key[i] ^ pad[i];
    }
    return o;
}

export function pjclHMAC_SHA384XorWithPad(pad,key) {
    var o = [];
    for (var i = 0; i < 1024; i++) {
        o[i] = key[i] ^ pad[i];
    }
    return o;
}
    
export function pjclHMAC_SHA256(key,text) {
    // begin arg checking
    if (!(pjclIsBitArray(key))) {throw new Error(" key not a bit array in pjclHMAC_SHA256 ");}
    if (!(pjclIsBitArray(text))) {throw new Error(" text not a bit array in pjclHMAC_SHA256 ");}
    // end arg checking 
    if (key.length > 512) { // here 512 = blockLength of SHA-256
        key = pjclSHA256(key);
    }
    key = key.concat();
    for (var i = 0; i < (512 - key.length); i++){
        key.push(0);
    }
    var v = pjclHMAC_SHA256XorWithPad(pjclIpad512,key);
     var w = pjclSHA256(v.concat(text));
    var x = pjclHMAC_SHA256XorWithPad(pjclOpad512,key);
    return pjclSHA256(x.concat(w));
}    

export function pjclHMAC_SHA384(key,text) {
    // begin arg checking
    if (!(pjclIsBitArray(key))) {throw new Error(" key not a bit array in pjclHMAC_SHA384 ");}
    if (!(pjclIsBitArray(text))) {throw new Error(" text not a bit array in pjclHMAC_SHA384 ");}
    // end arg checking  
    if (key.length > 1024) { // here 1024 = blockLength of SHA-384
        key = pjclSHA384(key);
    }
    key = key.concat();
    for (var i = 0; i < (1024 - key.length); i++){
        key.push(0);
    }
    var v = pjclHMAC_SHA384XorWithPad(pjclIpad1024,key);
     var w = pjclSHA384(v.concat(text));
    var x = pjclHMAC_SHA384XorWithPad(pjclOpad1024,key);
    return pjclSHA384(x.concat(w));
}

export function pjclHMAC_SHA256PreComputeKeyHashes(key) {
    // begin arg checking
    if (!(pjclIsBitArray(key))) {throw new Error(" key not a bit array in pjclHMAC_SHA256PreComputeKeyHashes ");}
    // end arg checking 
    if (key.length > 512) { // here 512 = blockLength of SHA-256
        key = pjclSHA256(key);
    }
    key = key.concat();
    for (var i = 0; i < (512 - key.length); i++){
            key.push(0);
    }
    var iKey = pjclHMAC_SHA256XorWithPad(pjclIpad512,key);
    var u = pjclSHA256Core(iKey,pjclSHA256IV);
    var oKey = pjclHMAC_SHA256XorWithPad(pjclOpad512,key);
    var v = pjclSHA256Core(oKey,pjclSHA256IV);
    return {iKeyHash: u, oKeyHash: v};
}

export function pjclHMAC_SHA256WithPreCompute(iKeyHash,oKeyHash,text) {
    // begin arg checking
    if (!(pjclIsArray(iKeyHash,8))) {throw new Error(" iKeyHash not an UI32 array of length 8 in pjclHMAC_SHA256WithPreCompute ");}  
    if (!(pjclIsArray(oKeyHash,8))) {throw new Error(" oKeyHash not an UI32 array of length 8 in pjclHMAC_SHA256WithPreCompute ");}
    if (!(pjclIsBitArray(text))) {throw new Error(" text not a bit array in pjclHMAC_SHA256WithPreCompute ");} 
    // end arg checking 
    var m = pjclPadTo512(text,text.length + 512);
    var w = pjclUI32Array2BitArray(pjclSHA256Core(m,iKeyHash));
    //the following is equivalent to pjclPadTo512(w)
    for (var i = 0; i < 256; i++) {
        w.push(0);
    }
    w[256] = 1;
    w[502] = 1;
    w[503] = 1;
    //
    var mac = pjclUI32Array2BitArray(pjclSHA256Core(w,oKeyHash));
    return mac;
}

export function pjclHMAC_SHA384PreComputeKeyHashes(key) {
    // begin arg checking
    if (!(pjclIsBitArray(key))) {throw new Error(" key not a bit array in pjclHMAC_SHA384PreComputeKeyHashes ");}
    // end arg checking 
    if (key.length > 1024) { // here 1024 = blockLength of SHA-384
        key = pjclSHA384(key);
    }
    key = key.concat();
    for (var i = 0; i < (1024 - key.length); i++){
            key.push(0);
    }
    var iKey = pjclHMAC_SHA384XorWithPad(pjclIpad1024,key);
    var u = pjclSHA512Core(iKey,pjclSHA384IV);
    var oKey = pjclHMAC_SHA384XorWithPad(pjclOpad1024,key);
    var v = pjclSHA512Core(oKey,pjclSHA384IV);
    return {iKeyHash: u, oKeyHash: v};
}

export function pjclHMAC_SHA384WithPreCompute(iKeyHash,oKeyHash,text) {
    // begin arg checking
    if (!(pjclIsArray(iKeyHash,16))) {throw new Error(" iKeyHash not an UI32 array of length 16 in pjclHMAC_SHA384WithPreCompute ");}  
    if (!(pjclIsArray(oKeyHash,16))) {throw new Error(" oKeyHash not an UI32 array of length 16 in pjclHMAC_SHA384WithPreCompute ");}
    if (!(pjclIsBitArray(text))) {throw new Error(" text not a bit array in pjclHMAC_SHA384WithPreCompute ");}    
    // end arg checking 
    var m = pjclPadTo1024(text,text.length + 1024);
    var u = pjclSHA512Core(m,iKeyHash);
    u.length = 12;
    var w = pjclUI32Array2BitArray(u);
    //the following is equivalent to pjclPadTo1024(w)
    for (var i = 0; i < 640; i++) {
        w.push(0);
    }
    w[384] = 1;
    w[1013] = 1;
    w[1015] = 1;
    w[1016] = 1;
    //
    var v = pjclSHA512Core(w,oKeyHash);
    v.length = 12;
    var mac = pjclUI32Array2BitArray(v);
    return mac;
}

const pjclHKDF_SHA256_DefaultSalt = [
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
];
const pjclHKDF_SHA256_DefaultSalt_KeyHashes = pjclHMAC_SHA256PreComputeKeyHashes(pjclHKDF_SHA256_DefaultSalt);
const pjclHKDF_SHA256_DefaultSalt_iKeyHash = pjclHKDF_SHA256_DefaultSalt_KeyHashes.iKeyHash;
const pjclHKDF_SHA256_DefaultSalt_oKeyHash = pjclHKDF_SHA256_DefaultSalt_KeyHashes.oKeyHash; 

export function pjclHKDF_SHA256_Expand(PRK,info,L) {
    var PRK_Bits = pjclByteArray2BitArray(PRK);
    var info_Bits = pjclByteArray2BitArray(info); 
    var PRK_KeyHashes = pjclHMAC_SHA256PreComputeKeyHashes(PRK_Bits);
    var PRK_iKeyHash = PRK_KeyHashes.iKeyHash;
    var PRK_oKeyHash = PRK_KeyHashes.oKeyHash;
    var n = Math.ceil(L/32);
    var OKM_Bits = [];
    var t = [];
    for (var i = 1; i <= n; i++) {
        t = pjclHMAC_SHA256WithPreCompute(PRK_iKeyHash,PRK_oKeyHash,t.concat(info_Bits).concat(pjclByte2BitArray(i)));
        OKM_Bits.push(...t);        
    }
    var OKM = pjclBitArray2ByteArray(OKM_Bits);
    OKM.length = L;
    return OKM;      
}

export function pjclHKDF_SHA256(IKM,L,salt,info) {
    var IKM_Bits = pjclByteArray2BitArray(IKM);
    if (info === undefined) {
        info = [];
    } 
    if (salt === undefined) {
        var PRK_Bits = pjclHMAC_SHA256WithPreCompute(pjclHKDF_SHA256_DefaultSalt_iKeyHash,pjclHKDF_SHA256_DefaultSalt_oKeyHash,IKM_Bits);    
    }
    else {
        var salt_Bits = pjclByteArray2BitArray(salt);
        var PRK_Bits = pjclHMAC_SHA256(salt_Bits,IKM_Bits);
    }
    var PRK = pjclBitArray2ByteArray(PRK_Bits);
    return pjclHKDF_SHA256_Expand(PRK,info,L);     
} 

export function pjclPBKDF2_SHA256(P,salt,count,dkLen) {
    // begin arg checking
    if (dkLen > 0xffffffff) {throw new Error (" desired derived key too long ");}
    // end arg checking
    var l = Math.ceil(dkLen/32);
    var P_Bits = pjclByteArray2BitArray(P);
    var salt_Bits = pjclByteArray2BitArray(salt);
    var DK = [];
    for (var i = 1; i <= l; i++) {
        var U_bitArray = pjclHMAC_SHA256(P_Bits, salt_Bits.concat(pjclUI32toBitArray(i)));
        var U_UI32Array = pjclBitArray2UI32Array(U_bitArray);
        var F = U_UI32Array;
        for (var c = 2; c <= count; c++) {
            U_bitArray = pjclHMAC_SHA256(P_Bits,U_bitArray);
            U_UI32Array = pjclBitArray2UI32Array(U_bitArray);
            for (var j = 0; j < 8; j++) {
                F[j] = F[j] ^ U_UI32Array[j];
            }
        }
        DK.push(...pjclUI32Array2ByteArray(F));
    }
    DK.length = dkLen;
    return DK; 
}
    
export function pjclStRndLimb() {
    var a = Math.floor(Math.random() * pjclBase);
    return a;
}

export function pjclStRndBigInt(n) {
    // begin arg checking
    if (!(typeof n == "number")) {throw new Error(" n not a number in pjclStRndBigInt ");}
    if (!(n == Math.floor(n))) {throw new Error(" n not an integer in pjclStRndBigInt ");}
    if (!(n > 0)) {throw new Error(" n not positive in pjclStRndBigInt ");}
    // end arg checking
    var a = [];
    for (var i = 0; i < n; i++) {
        a.push(pjclRndomLimb());
    }
    var l = a.length;
    while (l > 0) {
        if (a[--l] != 0) {
            l++;        
            break;
        }
    }
    a.length = l;
    return a;
}
    
export function pjclStRndHex(n) {
    // begin arg checking
    if (!(typeof n == "number")) {throw new Error(" n not a number in pjclStRndHex ");}
    if (!(n == Math.floor(n))) {throw new Error(" n not an integer in pjclStRndHex ");}
    if (!(n > 0)) {throw new Error(" n not positive in pjclStRndHex ");}
    // end arg checking
    var s = "";
    for (var i = 0; i < n; i++) {
        s += (Math.floor(Math.random() * 0x10).toString(16));        
    }
    return s;
}
    
export function pjclStatisticalRNG(a,b) {
    // begin arg checking
    if (!pjclWellFormed(a)) {throw new Error(" a not well formed in pjclStatisticalRNG ");}
    if (a.negative) {throw new Error(" a negative in pjclStatisticalRNG ");}
    if (!pjclWellFormed(b)) {throw new Error(" b not well formed in pjclStatisticalRNG ");}
    if (b.negative) {throw new Error(" b negative in pjclStatisticalRNG ");}
    if (!pjclGreaterThan(b,a)) {throw new Error(" b not greater than a in pjclStatisticalRNG ");}
    // end arg checking 
    var x, h; 
    var d = pjclSub(b,a);
    if (d.length === 1) {
        h = Math.random();
        x = [Math.floor(h * d[0])];
    }
    else {
        while (true) {      
            x = [];
            var i = 0;
            while (i < d.length - 2) {
                x[i] = pjclStRndLimb();
                i++;
            }
            h = Math.random();
            var w = d.slice(-2);
            var z = Math.floor(h * (w[1] * pjclBase + w[0] + 1));
            var z0 = z & pjclBaseMask;
            x[i++] = z0;
            x[i] = (z - z0) / pjclBase;
            var l = x.length;
            while (l > 0) {
                if (x[--l] != 0) {
                    l++;        
                    break;
                }
            }
            x.length = l;
            if (pjclGreaterThan(d,x)) {
                break;
            }
        }
    }
    return pjclAdd(x,a);
}

export function pjclRBG128Instantiate(rbgStateStorage,entropy,nonce) {
    // begin arg checking
    if (!(pjclIsBitArray(entropy))) {throw new Error(" entropy not a bit array in pjclRBG128Instantiate ");}
    if (!(nonce === undefined || pjclIsBitArray(nonce))) {throw new Error(" nonce not a bit array in pjclRBG128Instantiate ");}
    // end arg checking
    if (rbgStateStorage.pjclRBG192_v) {
        throw new Error(" A DRBG of a different security strength is already instantiated in rbgStateStorage ");
    } 
    var securityStrength = 128;
    if (entropy.length < securityStrength) {
        throw new Error(" Entropy bit array must have at least" + securityStrength + "bits ");
    }
    var seedLength = 440;
    if (nonce === undefined) {
        nonce = pjclUI32toBitArray((new Date()).getTime());
    }
    var seedMaterial = entropy.concat(nonce);
    var seed = pjclHash256_df(seedMaterial,seedLength);
    var x = [0,0,0,0,0,0,0,0].concat(seed);
    var c = pjclHash256_df(x,seedLength);
    rbgStateStorage.pjclRBG128_v = pjclBitArray2Hex(seed); 
    rbgStateStorage.pjclRBG128_c = pjclBitArray2Hex(c);
    rbgStateStorage.pjclRBG128_reseed_counter = "1";     
}

export function pjclHash256_df(inputBitArray,outputBitLength) {
    var temp = [];
    var hashLength = 256;
    var length = Math.ceil(outputBitLength/hashLength);
    var counter = 1;
    for (var i = 1; i <= length; i++) {
        var hashInput = pjclByte2BitArray(counter).concat(pjclUI32toBitArray(outputBitLength)).concat(inputBitArray);
        temp = temp.concat(pjclSHA256(hashInput));
        counter+= 1;
    }
    return temp.slice(0,outputBitLength);
}

export function pjclWellFormedRBG128State(rbgStateStorage) {
    if (!rbgStateStorage) {
        return false;
    }
    if (typeof rbgStateStorage.pjclRBG128_v !== "string") {
        return false;
    }
    var seedLength = 440;
    if (rbgStateStorage.pjclRBG128_v.length !== seedLength/4) {
        return false;
    }
    if (typeof rbgStateStorage.pjclRBG128_c !== "string") {
        return false;
    }
    if (rbgStateStorage.pjclRBG128_c.length !== seedLength/4) {
        return false;
    }
    if (typeof rbgStateStorage.pjclRBG128_reseed_counter !== "string") {
        return false;
    }
    var n = parseInt(rbgStateStorage.pjclRBG128_reseed_counter,16);
    if (!(n >=1 && n < 0x1000000000000)) {
        return false;
    }
    return true;
}

export function pjclRBG128Reseed(rbgStateStorage, entropy) {
    // begin arg checking
    if (!pjclWellFormedRBG128State(rbgStateStorage)) {
        throw new Error (" rbgStateStorage not well-formed in pjclRBG128Reseed ");}
    if (!(pjclIsBitArray(entropy))) {throw new Error(" entropy not a bit array in pjclRBG128Reseed ");} 
    // end arg checking
    var v = pjclHex2BitArray(rbgStateStorage.pjclRBG128_v);
    var c = pjclHex2BitArray(rbgStateStorage.pjclRBG128_c);
    var securityStrength = 128;
    if (entropy.length < securityStrength) {
        throw new Error(" entropy less than security strength in pjclRBG128Reseed; reseed terminated ");
    }
    var seedLength = 440;
    var seedMaterial = [0,0,0,0,0,0,0,1].concat(v).concat(entropy);
    var seed = pjclHash256_df(seedMaterial,seedLength);
    var x = [0,0,0,0,0,0,0,0].concat(seed);
    var c = pjclHash256_df(x,seedLength);
    rbgStateStorage.pjclRBG128_v = pjclBitArray2Hex(seed);
    rbgStateStorage.pjclRBG128_c = pjclBitArray2Hex(c);
    rbgStateStorage.pjclRBG128_reseed_counter = "1";     
}

export function pjclRBG128InstantiateOrReseed(rbgStateStorage,entropy,nonce) {
    // begin arg checking
    if (!(pjclIsBitArray(entropy))) {throw new Error(" entropy not a bit array in pjclRBG128InstantiateOrReseed ");}
    if (!(nonce === undefined || pjclIsBitArray(nonce))) {throw new Error(" nonce not a bit array in pjclRBG128InstantiateOrReseed ");} 
    // end arg checking
    var securityStrength = 128;
    if (entropy.length < securityStrength) {
        throw new Error(" Entropy bit array must have at least" + securityStrength + "bits ");
    }
    if (pjclWellFormedRBG128State(rbgStateStorage)) {
        if (nonce) {
            entropy = entropy.concat(nonce);
        }
        pjclRBG128Reseed(rbgStateStorage, entropy);
    }
    else {
        pjclRBG128Instantiate(rbgStateStorage,entropy,nonce);
    }
}    

export function pjclRBG128Gen(rbgStateStorage,bitLength) {
    // begin arg checking
    if (!pjclWellFormedRBG128State(rbgStateStorage)) {
        throw new Error(" rbgStateStorage not well-formed in pjclRBG128Gen ");
    }
    if (!(typeof bitLength == "number")) {throw new Error(" bitLength not a number in pjclRBG128Gen ");}
    if (!(bitLength == Math.floor(bitLength))) {throw new Error(" bitLength not an integer in pjclRBG128Gen ");}
    if (!(bitLength > 0)) {throw new Error(" bitLength not greater than zero in pjclRBG128Gen ");}
    // end arg checking
    if (bitLength > 0x80000) {
        throw new Error(" requested bitLength is greater than allowed in pjclRBG128Gen ");
    }
    var v = pjclHex2BitArray(rbgStateStorage.pjclRBG128_v);
    var c = pjclHex2BigInt(rbgStateStorage.pjclRBG128_c);
    var counter = pjclHex2BigInt(rbgStateStorage.pjclRBG128_reseed_counter);
    if (counter.length > 2) { //hard codes that pjclBaseBitLength = 24
        throw new Error(" reseed counter greater than or equal to 2^(48); must reseed ");
    }
    var hashLength = 256;
    var seedLength = 440;
    var m = Math.ceil(bitLength/hashLength);
    var w = [];
    var data = v;
    var i = 1;
    while (true) {
        w = w.concat(pjclSHA256(data));
        if (i == m) {
            break;
        }
        data = pjclBigInt2SizedBitArray(pjclAdd(pjclBitArray2BigInt(data),[1]),seedLength);
        i++;
    }
    var bitArray = w.slice(0,bitLength);
    var h = pjclSHA256([0,0,0,0,0,0,1,1].concat(v));
    var v1 = pjclAdd(pjclBitArray2BigInt(v),pjclBitArray2BigInt(h));
    var v2 = pjclAdd(c,counter);
    v = pjclBigInt2SizedBitArray(pjclAdd(v1,v2),seedLength);
    counter = pjclAdd(counter,[1]);
    rbgStateStorage.pjclRBG128_v = pjclBitArray2Hex(v);
    rbgStateStorage.pjclRBG128_reseed_counter = pjclBigInt2Hex(counter);
    return bitArray;
}

export function pjclRBG192Instantiate(rbgStateStorage,entropy,nonce) {
    // begin arg checking
    if (!(pjclIsBitArray(entropy))) {throw new Error(" entropy not a bit array in pjclRBG192Instantiate ");}
    if (!(nonce === undefined || pjclIsBitArray(nonce))) {throw new Error(" nonce not a bit array in pjclRBG192Instantiate ");}
    // end arg checking
    if (rbgStateStorage.pjclRBG128_v) {
        throw new Error(" A DRBG of a different security strength is already instantiated in rbgStateStorage ");
    }  
    var securityStrength = 192;
    if (entropy.length < securityStrength) {
        throw new Error(" Entropy bit array must have at least" + securityStrength + "bits ");
    }
    var seedLength = 888;
    if (nonce === undefined) {
        nonce = pjclUI32toBitArray((new Date()).getTime());
    }
    var seedMaterial = entropy.concat(nonce);
    var seed = pjclHash384_df(seedMaterial,seedLength);
    var x = [0,0,0,0,0,0,0,0].concat(seed);
    var c = pjclHash384_df(x,seedLength);
    rbgStateStorage.pjclRBG192_v = pjclBitArray2Hex(seed); //bitArray.length is divisible by 4
    rbgStateStorage.pjclRBG192_c = pjclBitArray2Hex(c);//bitArray.length is divisible by 4
    rbgStateStorage.pjclRBG192_reseed_counter = "1";     
}

export function pjclHash384_df(inputBitArray,outputBitLength) {
    var temp = [];
    var hashLength = 384;
    var length = Math.ceil(outputBitLength/hashLength);
    var counter = 1;
    for (var i = 1; i <= length; i++) {
        var hashInput = pjclByte2BitArray(counter).concat(pjclUI32toBitArray(outputBitLength)).concat(inputBitArray);
        temp = temp.concat(pjclSHA384(hashInput));
        counter+= 1;
    }
    return temp.slice(0,outputBitLength);
}

export function pjclWellFormedRBG192State(rbgStateStorage) {
    if (!rbgStateStorage) {
        return false;
    }
    if (typeof rbgStateStorage.pjclRBG192_v !== "string") {
        return false;
    }
    var seedLength = 888;
    if (rbgStateStorage.pjclRBG192_v.length !== seedLength/4) {
        return false;
    }
    if (typeof rbgStateStorage.pjclRBG192_c !== "string") {
        return false;
    }
    if (rbgStateStorage.pjclRBG192_c.length !== seedLength/4) {
        return false;
    }
    if (typeof rbgStateStorage.pjclRBG192_reseed_counter !== "string") {
        return false;
    }
    var n = parseInt(rbgStateStorage.pjclRBG192_reseed_counter,16);
    if (!(n >=1 && n < 0x1000000000000)) {
        return false;
    }
    return true;
}

export function pjclRBG192Reseed(rbgStateStorage,entropy) {
    // begin arg checking
    if (!pjclWellFormedRBG192State(rbgStateStorage)) {
        throw new Error(" rbgStateStorage not well-formed in pjclRBG192Reseed ") 
    }
    if (!(pjclIsBitArray(entropy))) {throw new Error("entropy not a bit array in pjclRBG192Reseed");} 
    // end arg checking    
    var v = pjclHex2BitArray(rbgStateStorage.pjclRBG192_v);
    var c = pjclHex2BitArray(rbgStateStorage.pjclRBG192_c);
    var securityStrength = 192;
    if (entropy.length < securityStrength) {
        throw new Error(" entropy less than security strength in pjclRBG192Reseed; reseed terminated ");
    }
    var seedLength = 888;
    var seedMaterial = [0,0,0,0,0,0,0,1].concat(v).concat(entropy);
    var seed = pjclHash384_df(seedMaterial,seedLength);
    var x = [0,0,0,0,0,0,0,0].concat(seed);
    var c = pjclHash384_df(x,seedLength);
    rbgStateStorage.pjclRBG192_v = pjclBitArray2Hex(seed);
    rbgStateStorage.pjclRBG192_c = pjclBitArray2Hex(c);
    rbgStateStorage.pjclRBG192_reseed_counter = "1";     
}

export function pjclRBG192InstantiateOrReseed(rbgStateStorage,entropy,nonce) {
    // begin arg checking
    if (!(pjclIsBitArray(entropy))) {throw new Error(" entropy not a bit array in pjclRBG192InstantiateOrReseed ");}
    if (!(nonce === undefined || pjclIsBitArray(nonce))) {throw new Error(" nonce not a bit array in pjclRBG192InstantiateOrReseed ");} 
    // end arg checking
    var securityStrength = 192;
    if (entropy.length < securityStrength) {
        throw new Error(" Entropy bit array must have at least" + securityStrength + "bits ");
    }

    if (pjclWellFormedRBG192State(rbgStateStorage)) {
        if (nonce) {
            entropy = entropy.concat(nonce);
        }
        pjclRBG192Reseed(rbgStateStorage, entropy);
    }
    else {
        pjclRBG192Instantiate(rbgStateStorage,entropy,nonce);
    }
}    

export function pjclRBG192Gen(rbgStateStorage,bitLength) {
    // begin arg checking
    if (!pjclWellFormedRBG192State(rbgStateStorage)) {
        throw new Error(" rbgStateStorage not well-formed in pjclRBG192Gen ");
    }
    if (!(typeof bitLength == "number")) {throw new Error(" bitLength not a number in pjclRBG192Gen ");}
    if (!(bitLength == Math.floor(bitLength))) {throw new Error(" bitLength not an integer in pjclRBG192Gen ");}
    if (!(bitLength > 0)) {throw new Error(" bitLength not greater than zero in pjclRBG192Gen ");}
    // end arg checking
    if (bitLength > 0x80000) {
        throw new Error(" requested bitLength is greater than allowed in pjclRBG192Gen ");
    }
    var v = pjclHex2BitArray(rbgStateStorage.pjclRBG192_v);
    var c = pjclHex2BigInt(rbgStateStorage.pjclRBG192_c);
    var counter = pjclHex2BigInt(rbgStateStorage.pjclRBG192_reseed_counter);
    if (counter.length > 2) {//<<<only OK if pjclBaseBitLength = 24
        throw new Error(" reseed counter greater than or equal to 2^(48); must reseed ");
    }
    var hashLength = 384;
    var seedLength = 888;
    var m = Math.ceil(bitLength/hashLength);
    var w = [];
    var data = v;
    var i = 1;
    while (true) {
        w = w.concat(pjclSHA384(data));//change name
        if (i == m) {
            break;
        }
        data = pjclBigInt2SizedBitArray(pjclAdd(pjclBitArray2BigInt(data),[1]),seedLength);
        i++;
    }
    var bitArray = w.slice(0,bitLength);
    var h = pjclSHA384([0,0,0,0,0,0,1,1].concat(v));
    var v1 = pjclAdd(pjclBitArray2BigInt(v),pjclBitArray2BigInt(h));
    var v2 = pjclAdd(c,counter);
    v = pjclBigInt2SizedBitArray(pjclAdd(v1,v2),seedLength);
    counter = pjclAdd(counter,[1]);
    rbgStateStorage.pjclRBG192_v = pjclBitArray2Hex(v);
    rbgStateStorage.pjclRBG192_reseed_counter = pjclBigInt2Hex(counter);
    return bitArray;
}

export function pjclRBGSecStrength(rbgStateStorage) {
    if (rbgStateStorage.pjclRBG128_v) {
        return 128;
    }
    if (rbgStateStorage.pjclRBG192_v) {
        return 192;
    }
    throw new Error (" could not determine RBG security strength ");    
}

export function pjclRBGGen(rbgStateStorage,requestedSecStrength,bitLength) {
    var rbgSecStrength = pjclRBGSecStrength(rbgStateStorage);
    if (requestedSecStrength > rbgSecStrength) {
        throw new Error("requested security strength not available");
    }    
    if (rbgStateStorage.pjclRBG128_v !== undefined) {
        return pjclRBG128Gen(rbgStateStorage,bitLength);
    }
    else { // only 128 and 192 RBG security strengths in this version of library
        return pjclRBG192Gen(rbgStateStorage,bitLength);
    }
}

export function pjclCryptoRNG(rbgStateStorage,requestedSecStrength,a,b) {
    // begin arg checking
    if (!pjclWellFormed(a)) {throw new Error(" a not well formed in pjclCryptoRNG ");}
    if (a.negative) {throw new Error(" a negative in pjclCryptoRNG  ");}
    if (!pjclWellFormed(b)) {throw new Error(" b not well formed in pjclCryptoRNG ");}
    if (b.negative) {throw new Error(" b negative in pjclCryptoRNG ");}
    if (!pjclGreaterThan(b,a)) {throw new Error(" b not greater than a in pjclCryptoRNG ");}
    // end arg checking
    var d = pjclSub(b,a);    
    var c = pjclBitArray2BigInt(pjclRBGGen(rbgStateStorage,requestedSecStrength,pjclBitLengthOfBigInt(d) + 64));
    var x = pjclMod(c,d);
    return pjclAdd(x,a);
}
    
const pjclPrimesLessThan4096 = 
[
2,    3,    5,    7,    11,    13,    17,    19,    23,    29,
31,    37,    41,    43,    47,    53,    59,    61,    67,    71,
73,    79,    83,    89,    97,    101,    103,    107,    109,    113,
127,    131,    137,    139,    149,    151,    157,    163,    167,    173,
179,    181,    191,    193,    197,    199,    211,    223,    227,    229,
233,    239,    241,    251,    257,    263,    269,    271,    277,    281,
283,    293,    307,    311,    313,    317,    331,    337,    347,    349,
353,    359,    367,    373,    379,    383,    389,    397,    401,    409,
419,    421,    431,    433,    439,    443,    449,    457,    461,    463,
467,    479,    487,    491,    499,    503,    509,    521,    523,    541,
547,    557,    563,    569,    571,    577,    587,    593,    599,    601,
607,    613,    617,    619,    631,    641,    643,    647,    653,    659,
661,    673,    677,    683,    691,    701,    709,    719,    727,    733,
739,    743,    751,    757,    761,    769,    773,    787,    797,    809,
811,    821,    823,    827,    829,    839,    853,    857,    859,    863,
877,    881,    883,    887,    907,    911,    919,    929,    937,    941,
947,    953,    967,    971,    977,    983,    991,    997,    1009,    1013,
1019,    1021,    1031,    1033,    1039,    1049,    1051,    1061,    1063,    1069,
1087,    1091,    1093,    1097,    1103,    1109,    1117,    1123,    1129,    1151,
1153,    1163,    1171,    1181,    1187,    1193,    1201,    1213,    1217,    1223,
1229,    1231,    1237,    1249,    1259,    1277,    1279,    1283,    1289,    1291,
1297,    1301,    1303,    1307,    1319,    1321,    1327,    1361,    1367,    1373,
1381,    1399,    1409,    1423,    1427,    1429,    1433,    1439,    1447,    1451,
1453,    1459,    1471,    1481,    1483,    1487,    1489,    1493,    1499,    1511,
1523,    1531,    1543,    1549,    1553,    1559,    1567,    1571,    1579,    1583,
1597,    1601,    1607,    1609,    1613,    1619,    1621,    1627,    1637,    1657,
1663,    1667,    1669,    1693,    1697,    1699,    1709,    1721,    1723,    1733,
1741,    1747,    1753,    1759,    1777,    1783,    1787,    1789,    1801,    1811,
1823,    1831,    1847,    1861,    1867,    1871,    1873,    1877,    1879,    1889,
1901,    1907,    1913,    1931,    1933,    1949,    1951,    1973,    1979,    1987,
1993,    1997,    1999,    2003,    2011,    2017,    2027,    2029,    2039,    2053,
2063,    2069,    2081,    2083,    2087,    2089,    2099,    2111,    2113,    2129,
2131,    2137,    2141,    2143,    2153,    2161,    2179,    2203,    2207,    2213,
2221,    2237,    2239,    2243,    2251,    2267,    2269,    2273,    2281,    2287,
2293,    2297,    2309,    2311,    2333,    2339,    2341,    2347,    2351,    2357,
2371,    2377,    2381,    2383,    2389,    2393,    2399,    2411,    2417,    2423,
2437,    2441,    2447,    2459,    2467,    2473,    2477,    2503,    2521,    2531,
2539,    2543,    2549,    2551,    2557,    2579,    2591,    2593,    2609,    2617,
2621,    2633,    2647,    2657,    2659,    2663,    2671,    2677,    2683,    2687,
2689,    2693,    2699,    2707,    2711,    2713,    2719,    2729,    2731,    2741,
2749,    2753,    2767,    2777,    2789,    2791,    2797,    2801,    2803,    2819,
2833,    2837,    2843,    2851,    2857,    2861,    2879,    2887,    2897,    2903,
2909,    2917,    2927,    2939,    2953,    2957,    2963,    2969,    2971,    2999,
3001,    3011,    3019,    3023,    3037,    3041,    3049,    3061,    3067,    3079,
3083,    3089,    3109,    3119,    3121,    3137,    3163,    3167,    3169,    3181,
3187,    3191,    3203,    3209,    3217,    3221,    3229,    3251,    3253,    3257,
3259,    3271,    3299,    3301,    3307,    3313,    3319,    3323,    3329,    3331,
3343,    3347,    3359,    3361,    3371,    3373,    3389,    3391,    3407,    3413,
3433,    3449,    3457,    3461,    3463,    3467,    3469,    3491,    3499,    3511,
3517,    3527,    3529,    3533,    3539,    3541,    3547,    3557,    3559,    3571,
3581,    3583,    3593,    3607,    3613,    3617,    3623,    3631,    3637,    3643,
3659,    3671,    3673,    3677,    3691,    3697,    3701,    3709,    3719,    3727,
3733,    3739,    3761,    3767,    3769,    3779,    3793,    3797,    3803,    3821,
3823,    3833,    3847,    3851,    3853,    3863,    3877,    3881,    3889,    3907,
3911,    3917,    3919,    3923,    3929,    3931,    3943,    3947,    3967,    3989,
4001,    4003,    4007,    4013,    4019,    4021,    4027,    4049,    4051,    4057,
4073,    4079,    4091,    4093
];

export function pjclIsPrime(n,t) {
    // begin arg checking
    if (!pjclWellFormed(n)) {throw new Error(" n not well formed in pjclIsPrime ");}
    if (n.negative) {throw new Error(" n negative in pjclIsPrime ");}
    if (!(typeof t == "number")) {throw new Error(" t not a number in pjclIsPrime ");}
    if (!(t == Math.floor(t))) {throw new Error(" t not an integer in pjclIsPrime ");}
    if (!(t > 0)) {throw new Error(" t not positive in pjclIsPrime");}    
    // end arg checking    
    for (var i = 0; i < pjclPrimesLessThan4096.length; i++) {
        var p = pjclPrimesLessThan4096[i]; 
        if (n.length == 1 && n[0] == p) {
            return true;
        }
        if (pjclShortDiv(n,p).remainder == 0){
            return false; // this includes the case where n = zero
        }
    }
    if (n.length == 1) {
        return true;
    }
    if (pjclMillerRabin(n,t)) {
        return false;
    }
    return true; 
}

export function pjclMillerRabin(n,t) {
    // begin arg checking
    if (!pjclWellFormed(n)) {throw new Error(" n not well formed in pjclMillerRabin ");}
    if (n.negative) {throw new Error(" n negative in pjclMillerRabin ");}    
    if (n.length < 2) {throw new Error(" n must have at least two limbs in pjclMillerRabin ");}
    if ((n[0] & 1) == 0) {throw new Error(" n even in pjclMillerRabin ");}
    if (!(t == Math.floor(t))) {throw new Error(" t not an integer in pjclMillerRabin ");}
    if (!(t > 0)) {throw new Error(" t not positive in pjclMillerRabin ");}    
    // end arg checking  
    var n_1 = n.concat();
    n_1[0] = n_1[0] & (~1); //n_1 = n - 1;
    var r = n_1; 
    var i = 0;
    while (r[i] == 0) {
        i++        
    }
    if (i>0) {
        r.splice(0,i);
    }
    var u = r[0];
    var v = 1;
    var j = 0;
    while (u & v == 0) {
        j++;
        v = v<<1;
    }
    var s = j + (pjclBaseBitLength * i);
    pjclShortShiftRight(r,j);
    var ws = pjclOptimalWindowSize(pjclBitLengthOfBigInt(r)); 
    var k = 1; 
    var context = pjclPre1MontExp(n);
    while (k <= t) {
        var a = pjclStatisticalRNG([2],n_1);
        pjclPre2MontExp(a,context);
        pjclPreExp(ws,context);
        var yR = pjclExp(r,context);
        var y = pjclPostMontExp(yR,context);
        var n1 = context.m1;
        if ((y.length != 1 || y[0] != 1) && !pjclEqual(y,n_1)) {
            for (j = 1; j < s && !pjclEqual(y,n_1); j++) {
                var y2R2 = pjclSqr(yR);
                yR = pjclMontRed(y2R2,n,n1);
                y = pjclMontRed(yR,n,n1); 
                //provably unnecessary to check whether y = 1
            }
            if (!pjclEqual(y,n_1)) {
                return true;
            }
        }
        k++;
    }
    return false;    
}

export function pjclFFCSecStrength(p,q) {
    if (pjclBitLengthOfBigInt(p) >= 15360 && pjclBitLengthOfBigInt(q) >= 512) {
        return 256;
    }
    if (pjclBitLengthOfBigInt(p) >= 7680 && pjclBitLengthOfBigInt(q) >= 384) {
        return 192;
    }
    if (pjclBitLengthOfBigInt(p) >= 3072 && pjclBitLengthOfBigInt(q) >= 256) {
        return 128;
    }
    if (pjclBitLengthOfBigInt(p) >= 2048 && pjclBitLengthOfBigInt(q) >= 224) {
        return 112;
    }
    return 0;
}

export function pjclFFCGenPQ_3072_256(domainParameterSeed) {
    // begin arg checking
    if (!(domainParameterSeed === undefined || pjclIsBitArray(domainParameterSeed))) {throw new Error(" domainParameterSeed is not a bit array in pjclFFCGenPQ_3072_256 ");}  
    // end arg checking
    if (domainParameterSeed === undefined) {
        domainParameterSeed = pjclHex2BitArray(pjclStRndHex(64)); 
    }
    for (
        var dPS = pjclBitArray2BigInt(domainParameterSeed);
        true; 
        dPS = pjclAdd(dPS,[1]), domainParameterSeed = pjclBigInt2SizedBitArray(dPS,256)
        ) {
        var U = pjclSHA256(domainParameterSeed);
        U[0] = 1;
        U[255] = 1;
        var q = pjclBitArray2BigInt(U);
        if (!pjclIsPrime(q,64)) {
            continue;
        }        
        for (var counter = 0; counter < 12288; counter++) {
            var W = [];
            for (var j = 0; j < 12; j++) {
                var V = pjclSHA256(pjclBigInt2SizedBitArray(pjclAdd(pjclAdd(dPS,[counter * 12 + 1]), j?[j]:[]),256));
                W = V.concat(W);
            }
            W[0] = 1;
            var X = pjclBitArray2BigInt(W);
            var qX2 = q.concat();
            pjclShortShiftLeft(qX2,1);
            var c = pjclMod(X,qX2);
            var p = pjclSub(X,pjclSub(c,[1]));
            if ((p[127] & 0x800000) == 0) {
                continue;
            }
            if (pjclIsPrime(p,64)) {
                var o = new Object();
                o.p = p;
                o.q = q;
                o.domainParameterSeed = domainParameterSeed;
                o.counter = counter;
                return o;
            }        
        }
    }
}

export function pjclFFCValidatePQ_3072_256(p,q,domainParameterSeed,counter) {
    if (counter > 12287) {
        return false;
    }
    var dPS = pjclBitArray2BigInt(domainParameterSeed);
    var U = pjclSHA256(domainParameterSeed);
    U[0] = 1;
    U[255] = 1;
    var computed_q = pjclBitArray2BigInt(U);
    if (!pjclEqual(computed_q,q)) {
        return false;
    }
    if (!pjclIsPrime(computed_q,64)) {
        return false;
    }    
    for (var i = 0; i <= counter; i++) {
        var W = [];
        for (var j = 0; j < 12; j++) {
            var V = pjclSHA256(pjclBigInt2SizedBitArray(pjclAdd(pjclAdd(dPS,[i * 12 + 1]), j?[j]:[]),256));
            W = V.concat(W);
        }
        W[0] = 1;
        var X = pjclBitArray2BigInt(W);
        var qX2 = q.concat();
        pjclShortShiftLeft(qX2,1);
        var c = pjclMod(X,qX2);
        var computed_p = pjclSub(X,pjclSub(c,[1]));
        if ((computed_p[127] & 0x800000) == 0) {
            continue;
        }
        if (pjclIsPrime(computed_p,64)) {
            if (i == counter && pjclEqual(computed_p,p)) {
                return true;
            }
            return false;
        }
    }
    return false;        
}

export function pjclFFCGenPQ_2048_256(domainParameterSeed) {
    // begin arg checking
    if (!(domainParameterSeed === undefined || pjclIsBitArray(domainParameterSeed))) {throw new Error(" domainParameterSeed is not a bit array in pjclFFCGenPQ_3072_256 ");}  
    // end arg checking
    if (domainParameterSeed === undefined) {
        domainParameterSeed = pjclHex2BitArray(pjclStRndHex(64)); 
    }
    for (
        var dPS = pjclBitArray2BigInt(domainParameterSeed);
        true; 
        dPS = pjclAdd(dPS,[1]), domainParameterSeed = pjclBigInt2SizedBitArray(dPS,256)
        ) {
        var U = pjclSHA256(domainParameterSeed);
        U[0] = 1;
        U[255] = 1;
        var q = pjclBitArray2BigInt(U);
        if (!pjclIsPrime(q,64)) {
            continue;
        }        
        for (var counter = 0; counter < 8192; counter++) {
            var W = [];
            for (var j = 0; j < 8; j++) {
                var V = pjclSHA256(pjclBigInt2SizedBitArray(pjclAdd(pjclAdd(dPS,[counter * 8 + 1]), j?[j]:[]),256));
                W = V.concat(W);
            }
            W[0] = 1;
            var X = pjclBitArray2BigInt(W);
            var qX2 = q.concat();
            pjclShortShiftLeft(qX2,1);
            var c = pjclMod(X,qX2);
            var p = pjclSub(X,pjclSub(c,[1]));
            if ((p[85] & 0x80) == 0) {
                continue;
            }
            if (pjclIsPrime(p,64)) {
                var o = new Object();
                o.p = p;
                o.q = q;
                o.domainParameterSeed = domainParameterSeed;
                o.counter = counter;
                return o;
            }        
        }
    }
}

export function pjclFFCValidatePQ_2048_256(p,q,domainParameterSeed,counter) {
    if (counter > 8191) {
        return false;
    }
    var dPS = pjclBitArray2BigInt(domainParameterSeed);
    var U = pjclSHA256(domainParameterSeed);
    U[0] = 1;
    U[255] = 1;
    var computed_q = pjclBitArray2BigInt(U);
    if (!pjclEqual(computed_q,q)) {
        return false;
    }
    if (!pjclIsPrime(computed_q,64)) {
        return false;
    }    
    for (var i = 0; i <= counter; i++) {
        var W = [];
        for (var j = 0; j < 8; j++) {
            var V = pjclSHA256(pjclBigInt2SizedBitArray(pjclAdd(pjclAdd(dPS,[i * 8 + 1]), j?[j]:[]),256));
            W = V.concat(W);
        }
        W[0] = 1;
        var X = pjclBitArray2BigInt(W);
        var qX2 = q.concat();
        pjclShortShiftLeft(qX2,1);
        var c = pjclMod(X,qX2);
        var computed_p = pjclSub(X,pjclSub(c,[1]));
        if ((computed_p[85] & 0x80) == 0) {
            continue;
        }
        if (pjclIsPrime(computed_p,64)) {
            if (i == counter && pjclEqual(computed_p,p)) {
                return true;
            }
            return false;
        }
    }
    return false;        
}

export function pjclFFCGenG_256(p,q,domainParameterSeed,index) {
    domainParameterSeed = domainParameterSeed || [];
    index = index || [0,0,0,0,0,0,0,0];
    // begin arg checking
    if (!pjclWellFormed(p)) {throw new Error(" p not well formed in pjclFFCGenG_256 ");}
    if (p.negative) {throw new Error(" p negative in pjclFFCGenG_256 ");} 
    if (!pjclWellFormed(q)) {throw new Error(" q not well formed in pjclFFCGenG_256 ");}
    if (q.negative) {throw new Error(" q negative in pjclFFCGenG_256 ");}
    if (!(pjclBitLengthOfBigInt(q) == 256)) {throw new Error(" bitLength of q not equal to 256 in pjclFFCGenG_256 ");}
    if (!(pjclIsBitArray(domainParameterSeed))) {throw new Error ("domainParameterSeed is not a bit array ");}
    if (!(pjclIsBitArray(index,8))) {throw new Error(" index not a bit array of eight bits in pjclFFCGenG_256 ");}
    // end arg checking
    var e = pjclDiv((pjclSub(p,[1])),q).quotient;
    for (var count = 1; count < 65536; count++) {
        var U = domainParameterSeed.concat([0,1,1,0,0,1,1,1,0,1,1,0,0,1,1,1,0,1,1,0,0,1,0,1,0,1,1,0,1,1,1,0]).concat(index).concat(pjclBigInt2SizedBitArray([count],16));
        var W = pjclBitArray2BigInt(pjclSHA256(U));
        var g = pjclMontExp(W,e,p);
        if (pjclGreaterThan(g,[1])) {
            return g;
        }
    }
    throw new Error("Invalid status; g could not be generated"); 
}

export function pjclFFCValidateG_256(g,p,q,domainParameterSeed,index) {
    // begin arg checking
    if (!pjclWellFormed(g)) {throw new Error(" g not well formed in pjclFFCValidateG_256 ");}
    if (g.negative) {throw new Error(" g negative in pjclFFCValidateG_256 ");} 
    if (!pjclWellFormed(p)) {throw new Error(" p not well formed in pjclFFCValidateG_256 ");}
    if (p.negative) {throw new Error(" p negative in pjclFFCValidateG_256 ");} 
    if (!pjclWellFormed(q)) {throw new Error(" q not well formed in pjclFFCValidateG_256 ");}
    if (q.negative) {throw new Error(" q negative in pjclFFCValidateG_256 ");}
    if (!(pjclBitLengthOfBigInt(q) == 256)) {throw new Error(" bitLength of q not equal to 256 in pjclFFCValidateG_256 ");}
    if (!(domainParameterSeed === undefined || pjclIsBitArray(domainParameterSeed))) {throw new Error(" domainParameterSeed is not a bit array in pjclFFCValidateG_256");}
    if (domainParameterSeed !== undefined && index === undefined) {throw new Error("if domainParameterSeed is defined, index must be defined");}  
    if (!(index === undefined || pjclIsBitArray(index,8))) {throw new Error(" index is not well formed ");}
    // end arg checking
    if (!(pjclGreaterThanOrEqual(g,[2]) && pjclGreaterThan(p,g))) {
        return false;
    }
    if (!(pjclEqual(pjclMontExp(g,q,p),[1]))) {
        return false;
    }
    if (domainParameterSeed === undefined && index === undefined) {
        return "Partially valid";
    }
    if (index === undefined || index.length != 8) {
        return false;
    }
    var e = pjclDiv((pjclSub(p,[1])),q).quotient;
    for (var count = 1; count < 65536; count++) {
        var U = domainParameterSeed.concat([0,1,1,0,0,1,1,1,0,1,1,0,0,1,1,1,0,1,1,0,0,1,0,1,0,1,1,0,1,1,1,0]).concat(index).concat(pjclBigInt2SizedBitArray([count],16));
        var W = pjclBitArray2BigInt(pjclSHA256(U));
        var computed_g = pjclMontExp(W,e,p);
        if (pjclGreaterThan(computed_g,[1])) {
            if (pjclEqual(computed_g,g)) {
                return "Valid";
            }
            return false;
        }
    }
    return false;
}

export function pjclFFCGenPQG_3072_256(domainParameterSeed,index) {
    var o = pjclFFCGenPQ_3072_256(domainParameterSeed);
    var g = pjclFFCGenG_256(o.p,o.q,o.domainParameterSeed,index);
    o.g = g;
    return o;
}

export function pjclFFCGenPQG_2048_256(domainParameterSeed,index) {
    var o = pjclFFCGenPQ_2048_256(domainParameterSeed);
    var g = pjclFFCGenG_256(o.p,o.q,o.domainParameterSeed,index);
    o.g = g;
    return o;
}

export function pjclFFCGenKeyPair(rbgStateStorage,p,q,g) {
    // begin arg checking
    if (!pjclWellFormed(p)) {throw new Error(" p not well formed in pjclFFCGenKeyPair ");}
    if (p.negative) {throw new Error(" p negative in pjclFFCGenKeyPair ");}
    if (!pjclWellFormed(q)) {throw new Error(" q not well formed in pjclFFCGenKeyPair ");}
    if (q.negative) {throw new Error(" q negative in pjclFFCGenKeyPair ");}
    if (!pjclWellFormed(g)) {throw new Error(" g not well formed in pjclFFCGenKeyPair ");}
    if (g.negative) {throw new Error("p negative in pjclFFCGenKeyPair ");}
    if (pjclRBGSecStrength(rbgStateStorage) < pjclFFCSecStrength(p,q)) {throw new Error(" rbgStateStorage does not have enough security strength for (p,q)");}
    // end arg checking
    var x = pjclCryptoRNG(rbgStateStorage,pjclFFCSecStrength(p,q),[2],q);
    var y = pjclMontExp(g,x,p);
    return {x: x, y: y};    
}

export function pjclFFCValidatePublicKey(p,q,g,y) {
    //begin arg checking
    if (!pjclWellFormed(p)) {throw new Error(" p not well formed in pjclFFCValidatePublicKey ");}
    if (p.negative) {throw new Error(" p negative in pjclFFCValidatePublicKey ");}
    if (!pjclWellFormed(q)) {throw new Error(" q not well formed in pjclFFCValidatePublicKey ");}
    if (q.negative) {throw new Error(" q negative in pjclFFCValidatePublicKey");}
    if (!pjclWellFormed(g)) {throw new Error(" g not well formed in pjclFFCValidatePublicKey");}
    if (g.negative) {throw new Error("p negative in pjclFFCValidatePublicKey");}
    if (!pjclWellFormed(y)) {throw new Error(" y not well formed in pjclFFCValidatePublicKey");}
    if (y.negative) {throw new Error("p negative in pjclFFCValidatePublicKey");}
    // end arg checking
    if (!(pjclGreaterThanOrEqual(y,[2]) && pjclGreaterThanOrEqual(pjclSub(p,[2]),y))) {
        return false;
    }
    if (!(pjclEqual(pjclMontExp(y,q,p),[1]))) {
        return false;
    }
    return "Valid";
}

export const pjclDSAGenPQ_3072_256 = pjclFFCGenPQ_3072_256;
export const pjclDSAValidatePQ_3072_256 = pjclFFCValidatePQ_3072_256;
export const pjclDSAGenPQ_2048_256 = pjclFFCGenPQ_2048_256;
export const pjclDSAValidatePQ_2048_256 = pjclFFCValidatePQ_2048_256;
export const pjclDSAGenG_256 = pjclFFCGenG_256;
export const pjclDSAValidateG_256 = pjclFFCValidateG_256;
export const pjclDSAGenPQG_3072_256 = pjclFFCGenPQG_3072_256;
export const pjclDSAGenPQG_2048_256 = pjclFFCGenPQG_2048_256;
export const pjclDSAGenKeyPair = pjclFFCGenKeyPair;
export const pjclDSAValidatePublicKey = pjclFFCValidatePublicKey;
                    
export function pjclDSASignHashK(p,q,g,x,hash,k,kInv) { 
    // begin arg checking
    if (!pjclWellFormed(p)) {throw new Error("p not well formed in pjclDSASignHashK ");}
    if (p.negative) {throw new Error("p negative in pjclDSASignHashK ");}
    if (!pjclWellFormed(q)) {throw new Error("q not well formed in pjclDSASignHashK ");}
    if (q.negative) {throw new Error("q negative in pjclDSASignHashK ");}
    if (!pjclWellFormed(g)) {throw new Error("g not well formed in pjclDSASignHashK ");}
    if (g.negative) {throw new Error("g negative in pjclDSASignHashK ");}
    if (!pjclWellFormed(x)) {throw new Error("x not well formed in pjclDSASignHashK ");}
    if (x.negative) {throw new Error("x negative in pjclDSASignHashK ");}
    if (!(pjclIsBitArray(hash))) {throw new Error("hash not a bit array in pjclDSASignHashK ");}
    if (!(hash.length >= 2 * (pjclFFCSecStrength(p,q)))) {throw new Error(" hash length not adequate for security strength of (p,q) ");} 
    // end arg checking    
    var r = pjclMod((pjclMontExp(g,k,p)),q);
    if (r.length == 0) {
        return;
    }
    var qLength = pjclBitLengthOfBigInt(q);
    if (qLength < hash.length){
        hash = hash.concat();
        hash.length = qLength;
    }
    var z = pjclBitArray2BigInt(hash); 
    var s = pjclMod(pjclMult(kInv,(pjclAdd(z,(pjclMult(x,r))))),q);
    if (s.length == 0) {
        return;
    }
    return {r:r, s:s};
}

export function pjclDSASignHash(rbgStateStorage,p,q,g,x,hash) {
    // begin arg checking
    if (pjclRBGSecStrength(rbgStateStorage) < pjclFFCSecStrength(p,q)) {throw new Error ("rbgStateStorage does not have enough security strength for (p,q)");}     
    // end arg checking
    while (true) {
        var k = pjclCryptoRNG(rbgStateStorage,pjclFFCSecStrength(p,q),[1],q);
        var kInv = pjclModInv(k,q);
        var o = pjclDSASignHashK(p,q,g,x,hash,k,kInv);
        if (o !== undefined) {
            return o;
        }
    }
}

export function pjclDSASignMsg(rbgStateStorage,p,q,g,x,msg) {
    // begin arg checking
    if (!(pjclIsBitArray(msg))) {throw new Error("message not a bit array in pjclDSASignMsg");}
    // end arg checking
    if (pjclFFCSecStrength(p,q) == 112 || pjclFFCSecStrength(p,q) == 128) {
        return pjclDSASignHash(rbgStateStorage,p,q,g,x,pjclSHA256(msg));
    }
    if (pjclFFCSecStrength(p,q) == 192) {
        return pjclDSASignHash(rbgStateStorage,p,q,g,x,pjclSHA384(msg));
    }
    throw new Error("no hash function of adequate security strength for (p,q) is available"); 
}

export function pjclDSAVerifyHash(p,q,g,y,hash,r,s) {
    // begin arg checking
    if (!pjclWellFormed(p)) {throw new Error("p not well formed in pjclDSAVerifyHash ");}
    if (p.negative) {throw new Error("p negative in pjclDSAVerifyHash ");}
    if (!pjclWellFormed(q)) {throw new Error("q not well formed in pjclDSAVerifyHash ");}
    if (q.negative) {throw new Error("q negative in pjclDSAVerifyHash ");}
    if (!pjclWellFormed(g)) {throw new Error("g not well formed in pjclDSAVerifyHash ");}
    if (g.negative) {throw new Error("g negative in pjclDSAVerifyHash ");}
    if (!pjclWellFormed(y)) {throw new Error("y not well formed in pjclDSAVerifyHash ");}
    if (y.negative) {throw new Error("y negative in pjclDSAVerifyHash ");}
    if (!(pjclIsBitArray(hash))) {throw new Error(" hash not a bit array in pjclDSAVerifyHash ");}
    if (!pjclWellFormed(r)) {throw new Error("r not well formed in pjclDSAVerifyHash ");}
    if (r.negative) {throw new Error("r negative in pjclDSAVerifyHash ");}
    if (!pjclWellFormed(s)) {throw new Error("s not well formed in pjclDSAVerifyHash ");}
    if (s.negative) {throw new Error("s negative in pjclDSAVerifyHash ");}    
    // end arg checking
    if (!(pjclGreaterThanRel(r,[]) && pjclGreaterThanRel(q,r) && pjclGreaterThanRel(s,[]) && pjclGreaterThanRel(q,s))) {
        return false;
    }
    var qLength = pjclBitLengthOfBigInt(q);
    if (qLength < hash.length){
        hash = hash.concat();
        hash.length = qLength;
    }
    var z1 = pjclBitArray2BigInt(hash);
    var w = pjclModInv(s,q);
    var u1 = pjclMod(pjclMult(z1,w),q);
    var u2 = pjclMod(pjclMult(r,w),q);
    var v1v2 = pjclMontExp2(g,y,u1,u2,p);
    var v = pjclMod(v1v2,q);
    if (pjclEqual(v,r)) {
        return true;
    }
    else {
        return false;
    }
}

export function pjclDSAVerifyMsg(p,q,g,y,msg,r,s) {
    // begin arg checking
    if (!(pjclIsBitArray(msg))) {throw new Error("message not a bit array in pjclDSAVerifyMsg");}
    // end arg checking
    if (pjclFFCSecStrength(p,q) == 112 || pjclFFCSecStrength(p,q) == 128) {
        return pjclDSAVerifyHash(p,q,g,y,pjclSHA256(msg),r,s);
    }
    if (pjclFFCSecStrength(p,q) == 192) {
        return pjclDSAVerifyHash(p,q,g,y,pjclSHA384(msg),r,s);
    }
    throw new Error("no hash function of adequate security strength for (p,q) is available");
}

export const pjclDHGenPQ_3072_256 = pjclFFCGenPQ_3072_256;
export const pjclDHValidatePQ_3072_256 = pjclFFCValidatePQ_3072_256;
export const pjclDHGenPQ_2048_256 = pjclFFCGenPQ_2048_256;
export const pjclDHValidatePQ_2048_256 = pjclFFCValidatePQ_2048_256;
export const pjclDHGenG_256 = pjclFFCGenG_256;
export const pjclDHValidateG_256 = pjclFFCValidateG_256;
export const pjclDHGenPQG_3072_256 = pjclFFCGenPQG_3072_256;
export const pjclDHGenPQG_2048_256 = pjclFFCGenPQG_2048_256;
export const pjclDHGenKeyPair = pjclFFCGenKeyPair;
export const pjclDHValidatePublicKey = pjclFFCValidatePublicKey;

export function pjclDH(p,x_A,y_B) {
    // begin arg checking
    if (!pjclWellFormed(p)) {throw new Error("p not well formed in pjclDH ");}
    if (p.negative) {throw new Error("p negative in pjclDH ");}
    if (p.length === 0) {throw new Error(" p equals zero in pjclDH ");}
    if (!pjclWellFormed(x_A)) {throw new Error("x_A not well formed in pjclDH ");}
    if (x_A.negative) {throw new Error("x_A negative in pjclDH ");}
    if (x_A.length === 0) {throw new Error("x_A equals zero in pjclDH")};
    if (!pjclWellFormed(y_B)) {throw new Error("y_B not well formed in pjclDH ");}
    if (y_B.negative) {throw new Error("y_B negative in pjclDH ");}
    if (!(pjclGreaterThanOrEqual(y_B,[2]) && pjclGreaterThanOrEqual(pjclSub(p,[2]),y_B))) {
        throw new Error("y_B not a valid public key");
    }
    // end arg checking
    var z = pjclMontExp(y_B,x_A,p);
    if (pjclEqual(z,[1])) {
        throw new Error ("Invalid keys");
    }
    var Z = pjclBigInt2ByteArray(z,Math.ceil(pjclBitLengthOfBigInt(p)/8));
    var Z = pjclBigInt2ByteArray(z,pjclBitLengthOfBigInt(p) >>> 3);
    return Z;    
}

export function pjclModSpecial(x,t,xc,m) {
    // begin arg checking
    if (!pjclWellFormed(x)) {throw new Error("x not well formed in pjclModSpecial ");}
    if (x.negative) {throw new Error("x negative in pjclModSpecial ");}
    if (!(typeof t == "number")) {throw new Error("t not a number in pjclModSpecial ");}
    if (!(t == Math.floor(t))) {throw new Error("t not an integer in pjclModSpecial ");}
    if (!(t > 0)) {throw new Error("t not positive in pjclModSpecial ");}
    if (!(typeof xc == "function")) {throw new Error(" xc is not a function in pjclModSpecial ");}
    if (!pjclWellFormed(m)) {throw new Error("m not well formed in pjclModSpecial ");}
    if (m.negative) {throw new Error("m negative in pjclModSpecial ");}
    if (m.length == 0) {throw new Error("m not greater than zero in pjclModSpecial ");}
    // end arg checking 
    var q = x.concat();
    var r = [];
    while (true) {
        var rr = q.concat();
        pjclTruncate(rr,t);
        r = pjclAdd(r,rr);
        pjclShiftRight(q,t);
        if (q.length == 0) {
            break;
        }
        q = xc(q);
    }
    while (pjclGreaterThanOrEqual(r,m)) {
        r = pjclSub(r,m);        
    }
    return r;    
}
    
export const pjclCurve_P256 = {
    t: 256,
    xc: function (x) {
        var y = [0,0,0,0,0,0,0,0,0].concat(x);
        pjclShortShiftLeft(y,8);
        y = pjclSub(y,[0,0,0,0,0,0,0,0].concat(x));
        y = pjclSub(y,[0,0,0,0].concat(x));
        y = pjclAdd(y,x);
        return y;
    },
    p: [0xffffff,0xffffff,0xffffff,0xffffff,0x0,0x0,0x0,0x0,0x1,0xffff00,0xffff],
    b: [0xd2604b,0x3c3e27,0xf63bce,0xcc53b0,0x1d06b0,0x86bc65,0x557698,0xb3ebbd,0x3a93e7,0x35d8aa,0x5ac6],
    n: [0x632551,0xcac2fc,0x84f3b9,0xa7179e,0xe6faad,0xffffbc,0xffffff,0xffffff,0x0,0xffff00,0xffff],
    G: {
        x: [0x98c296,0x3945d8,0xa0f4a1,0x2deb33,0x37d81,0x40f277,0xe563a4,0xf8bce6,0x2c4247,0xd1f2e1,0x6b17],
        y: [0xbf51f5,0x406837,0xcecbb6,0x6b315e,0xce3357,0x9e162b,0x4a7c0f,0x8ee7eb,0x1a7f9b,0x42e2fe,0x4fe3],
        z: [1]
    }
}

export const pjclCurve_P384 = {
    t: 384,
    xc: function (x) {
        var y = [0,0,0,0,0].concat(x);
        pjclShortShiftLeft(y,8);  
        y = pjclAdd(y,[0,0,0,0].concat(x));
        var z = [0].concat(x);
        pjclShortShiftLeft(z,8);
        y = pjclSub(y,z);
        y = pjclAdd(y,x);
        return y;
    },
    p: [0xffffff,0xff,0x0,0x0,0xffffff,0xfffeff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff],
    b: [0xec2aef,0xc8edd3,0x9d2a85,0x8a2ed1,0x56398d,0x875ac6,0x8f5013,0x31408,0x814112,0x9c6efe,0x19181d,0xe3f82d,0x8e056b,0xe7e498,0xa7e23e,0xb3312f],
    n: [0xc52973,0x196acc,0x7aecec,0x48b0a7,0x1a0db2,0x2ddf58,0x81f437,0xc7634d,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xffffff],
    G: {
        x: [0x760ab7,0x5e3872,0x6c3a54,0xbf5529,0x2f25d,0x2a3855,0xe08254,0x59f741,0xa79b98,0x3b628b,0x746e1d,0xf320ad,0xb1c71e,0x5378e,0x22be8b,0xaa87ca], 
        y: [0xea0e5f,0x1d7c90,0x9d7a43,0x1d7e81,0x60b1ce,0xb8c00a,0x13b5f0,0xe9da31,0x9a147c,0x1dbd28,0x29f8f4,0x9292dc,0x9e98bf,0x2c6f5d,0x4a9626,0x3617de],
        z: [1]
    }
}

export function pjclJacobian2Affine(P,curve) {
    // begin arg checking
    if (!pjclIsPoint(P)) {throw new Error(" P is not a point in pjclJacobian2Affine ");}
    // end arg checking
    if  (P.z.length == 1 && P.z[0] == 1) {
        return P;
    } 
    var zs = pjclModSpecial(pjclSqr(P.z),curve.t,curve.xc,curve.p);
    var x1 = pjclModInv(zs,curve.p);
    var x = pjclModSpecial(pjclMult(P.x,x1),curve.t,curve.xc,curve.p);
    var zc = pjclModSpecial(pjclMult(zs,P.z),curve.t,curve.xc,curve.p);
    var y1 = pjclModInv(zc,curve.p);
    var y = pjclModSpecial(pjclMult(P.y,y1),curve.t,curve.xc,curve.p);
    var p = {x: x, y: y, z: [1]};
    return p;
} 

export function pjclPointAdd(P1,P2,curve) {
    // begin arg checking
    if (!pjclIsPoint(P1)) {throw new Error(" P1 is not a point in pjclPointAdd ");}
    if (!pjclIsPoint(P2)) {throw new Error(" P2 is not a point in pjclPointAdd ");}
    // end arg checking
    if (P1.z.length == 0) {
        return P2;
    }
    if (P2.z.length == 0) {
        return P1;
    }
    if (P2.z.length == 1 && P2.z[0] == 1) {
        var r = P1.x;
        var tt = P1.y;
    }
    else {
        var z2s = pjclModSpecial(pjclSqr(P2.z),curve.t,curve.xc,curve.p);
        var r = pjclModSpecial(pjclMult(P1.x,z2s),curve.t,curve.xc,curve.p);
        var z2c = pjclModSpecial(pjclMult(P2.z,z2s),curve.t,curve.xc,curve.p);
        var tt = pjclModSpecial(pjclMult(P1.y,z2c),curve.t,curve.xc,curve.p);
    }
    var z1s = pjclModSpecial(pjclSqr(P1.z),curve.t,curve.xc,curve.p);
    var s = pjclModSpecial(pjclMult(P2.x,z1s),curve.t,curve.xc,curve.p);
    var z1c = pjclModSpecial(pjclMult(P1.z,z1s),curve.t,curve.xc,curve.p);
    var u = pjclModSpecial(pjclMult(P2.y,z1c),curve.t,curve.xc,curve.p);
    if (pjclGreaterThan(r,s)) {
        var v = pjclAdd(pjclSub(curve.p,r),s);
    }
    else {
        v = pjclSub(s,r);
    }
    if (pjclGreaterThan(tt,u)) {
        var w = pjclAdd(pjclSub(curve.p,tt),u);
    }
    else {
         w = pjclSub(u,tt);
    }
    if (v.length == 0) {
        if (w.length == 0) {
            return pjclPointDouble(P2,curve);
        }
        else {
            return {x: [1], y: [1], z: []};
        }
    }
    var vs = pjclModSpecial(pjclSqr(v),curve.t,curve.xc,curve.p);
    var vc = pjclModSpecial(pjclMult(vs,v),curve.t,curve.xc,curve.p);
    var x31 = pjclModSpecial(pjclMult(r,vs),curve.t,curve.xc,curve.p);
    var x32 = x31.concat(); 
    pjclShortShiftLeft(x32,1);
    if (pjclGreaterThan(x32,curve.p)) {
        x32 = pjclSub(x32,curve.p);
    }
    var x33 = pjclAdd(vc,x32);
    if (pjclGreaterThan(x33,curve.p)) {
        x33 = pjclSub(x33,curve.p);
    }
    var x34 = pjclModSpecial(pjclSqr(w),curve.t,curve.xc,curve.p);
    if (pjclGreaterThan(x33,x34)) {
        var x3 = pjclAdd(pjclSub(curve.p,x33),x34);
    }
    else {
        x3 = pjclSub(x34,x33);
    }
    
    if (pjclGreaterThan(x3,x31)) {
        var y31 = pjclAdd(pjclSub(curve.p,x3),x31);
    }
    else {
        y31 = pjclSub(x31,x3);
    }
    var y32 = pjclModSpecial(pjclMult(y31,w),curve.t,curve.xc,curve.p);
    var y33 = pjclModSpecial(pjclMult(tt,vc),curve.t,curve.xc,curve.p);
    if (pjclGreaterThan(y33,y32)) {
        var y3 = pjclAdd(pjclSub(curve.p,y33),y32);
    }
    else {
        y3 = pjclSub(y32,y33);
    }
    
    var z31 = pjclModSpecial(pjclMult(P1.z,P2.z),curve.t,curve.xc,curve.p);
    var z3 = pjclModSpecial(pjclMult(v,z31),curve.t,curve.xc,curve.p);
    return {x: x3, y: y3, z: z3};
}

export function pjclPointDouble(P,curve) { //A = -3
    // begin arg checking
    if (!pjclIsPoint(P)) {throw new Error(" P is not a point in pjclPointDouble ");}
    // end arg checking
    if (P.z.length == 0) {
        return {x: [1], y: [1], z: []};
    }
    var y1s = pjclModSpecial(pjclSqr(P.y),curve.t,curve.xc,curve.p);
    var v1 = pjclModSpecial(pjclMult(P.x,y1s),curve.t,curve.xc,curve.p);
    var v = v1;
    pjclShortShiftLeft(v,2);
    while (pjclGreaterThan(v,curve.p)) {
        v = pjclSub(v,curve.p);
    }
    
    var z1s = pjclModSpecial(pjclSqr(P.z),curve.t,curve.xc,curve.p);
    
    var w1 = pjclAdd(P.x,z1s);
    if (pjclGreaterThan(w1,curve.p)) {
        w1 = pjclSub(w1,curve.p);
    }
    if (pjclGreaterThan(z1s,P.x)) {
        var w2 = pjclAdd(pjclSub(curve.p,z1s),P.x);
    }
    else {
        w2 = pjclSub(P.x,z1s);
    }
    var w3 = pjclModSpecial(pjclMult(w1,w2),curve.t,curve.xc,curve.p);
    var w4 = w3.concat();
    pjclShortShiftLeft(w4,1);
    if (pjclGreaterThan(w4,curve.p)) {
        w4 = pjclSub(w4,curve.p);
    }
    var w = pjclAdd(w4,w3);
    if (pjclGreaterThan(w,curve.p)) {
        w = pjclSub(w,curve.p);
    }
    
    var x31 = pjclModSpecial(pjclSqr(w),curve.t,curve.xc,curve.p);
    var x32 = v.concat();
    pjclShortShiftLeft(x32,1);
    if (pjclGreaterThan(x32,curve.p)) {
        x32 = pjclSub(x32,curve.p);
    }
    if (pjclGreaterThan(x32,x31)) {
        var x3 = pjclAdd(pjclSub(curve.p,x32),x31);
    }
    else {
        x3 = pjclSub(x31,x32);
    }
    
    var y1q = pjclModSpecial(pjclSqr(y1s),curve.t,curve.xc,curve.p);
    var y31 = y1q;
    pjclShortShiftLeft(y31,3);
    while (pjclGreaterThan(y31,curve.p)) {
        y31 = pjclSub(y31,curve.p);
    }
    if (pjclGreaterThan(x3,v)) {
        var y32 = pjclAdd(pjclSub(curve.p,x3),v);
    }
    else {
        y32 = pjclSub(v,x3);
    }
    var y33 = pjclModSpecial(pjclMult(y32,w),curve.t,curve.xc,curve.p);
    if (pjclGreaterThan(y31,y33)) {
        var y3 = pjclAdd(pjclSub(curve.p,y31),y33);
    }
    else {
        y3 = pjclSub(y33,y31);
    }
    
    var z3 = pjclModSpecial(pjclMult(P.y,P.z),curve.t,curve.xc,curve.p);
    pjclShortShiftLeft(z3,1);
    if (pjclGreaterThan(z3,curve.p)) {
        z3 = pjclSub(z3,curve.p);
    }
    return {x: x3, y: y3, z: z3};
}

export function pjclContextualPointDouble(P1,context) {
    return pjclPointDouble(P1,context.curve);
}

export function pjclContextualPointAdd(P1,P2,context) {
    return pjclPointAdd(P1,P2,context.curve);
} 
         
export function pjclScalarMult(P,k,curve) {
    // begin arg checking
    if (!pjclIsPoint(P)) {throw new Error(" P is not a point in pjclScalarMult ");}
    if (!pjclWellFormed(k)) {throw new Error(" k not well formed in pjclScalarMult ");}
    if (k.negative) {throw new Error(" k negative in pjclScalarMult ");}
    // end arg checking
    if (k.length == 0) {
        return {x: [1], y: [1], z: []};
    }
    var context = new Object();
    context.g = {x: P.x, y: P.y, z: P.z};
    context.curve = curve;
    context.sqr = pjclContextualPointDouble;
    context.mult = pjclContextualPointAdd;
    var slidingWindowSize = pjclOptimalWindowSize(pjclBitLengthOfBigInt(k));
    pjclPreExp(slidingWindowSize,context);
    for (var i = 0; i < (1 << (slidingWindowSize - 1)); i++) {
        context.preComputed[i] = pjclJacobian2Affine(context.preComputed[i],curve);    
    }
    var A = pjclExp(k,context);
    return A;
}

export function pjclScalarMult2(P1,P2,u1,u2,curve) {
    // begin arg checking
    if (!pjclIsPoint(P1)) {throw new Error(" P1 is not a point in pjclScalarMult2 ");}
    if (!pjclIsPoint(P2)) {throw new Error(" P2 is not a point in pjclScalarMult2 ");}
    if (!pjclWellFormed(u1)) {throw new Error(" u1 not well formed in pjclScalarMult2 ");}
    if (u1.negative) {throw new Error(" u1 negative in pjclScalarMult2 ");}
    if (!pjclWellFormed(u2)) {throw new Error(" u2 not well formed in pjclScalarMult2 ");}    
    if (u2.negative) {throw new Error(" u2 negative in pjclScalarMult2 ");}
    // end arg checking
    if (u1.length == 0 && u2.length == 0) {
        return {x: [1], y: [1], z: []};
    }
    var context = new Object();
    context.g = {x: P1.x, y: P1.y, z: P1.z};
    context.y = {x: P2.x, y: P2.y, z: P2.z};
    context.curve = curve;
    context.sqr = pjclContextualPointDouble;
    context.mult = pjclContextualPointAdd;
    var slidingWindowSize = pjclOptimalWindowSize2(Math.max(pjclBitLengthOfBigInt(u1),pjclBitLengthOfBigInt(u2)));
    pjclPreExp2(slidingWindowSize,context);
    for (var i = 1; i < (1 << slidingWindowSize); i++) {
        context.preComputed[0][i] = pjclJacobian2Affine(context.preComputed[0][i],curve); 
    } 
    for (var i = 0; i < (1 << slidingWindowSize); i++) {
        for (var j = 1; j < (1 << slidingWindowSize); j++) {
            context.preComputed[j][i] = pjclJacobian2Affine(context.preComputed[j][i],curve); 
        }
    }
    var A = pjclExp2(u1,u2,context);
    return A;
}

export function pjclCurveSecStrength(curve) {
    if (curve.t === 256) {
        return 128;
    }
    if (curve.t === 384) {
        return 192;
    }
    return 0;    
}

export function pjclECCGenKeyPair(rbgStateStorage,curve) {
    // begin arg checking
    if (pjclRBGSecStrength(rbgStateStorage) < pjclCurveSecStrength(curve)) {throw new Error("RBG security strength not enough for curve");}
    // end arg checking
    var d = pjclCryptoRNG(rbgStateStorage,pjclCurveSecStrength(curve),[2],curve.n);
    var Q = pjclJacobian2Affine(pjclScalarMult(curve.G,d,curve),curve);    
    return {d: d, Q: Q};
}

export function pjclECCValidatePublicKey(Q,curve) {
    // begin arg checking
    if (!pjclIsPoint(Q)) {throw new Error(" Q is not a point in pjclECCValidatePublicKey ");}
    // end arg checking
    if (Q.z.length == 0) {
        return false;
    }
    var QAffine = pjclJacobian2Affine(Q,curve);
    if (!(pjclGreaterThanOrEqualRel(QAffine.x,[]) && pjclGreaterThanRel(curve.p,QAffine.x))) {
        return false;
    }
    if (!(pjclGreaterThanOrEqualRel(QAffine.y,[]) && pjclGreaterThanRel(curve.p,QAffine.y))) {
        return false;
    }
    var l = pjclMod(pjclSqr(QAffine.y),curve.p);
    var r = pjclMod(pjclAdd(pjclAdd(pjclMult(pjclSqr(QAffine.x),QAffine.x),pjclMult(pjclSub(curve.p,[3]),QAffine.x)),curve.b),curve.p);
    if (!pjclEqual(r,l)) {
        return false;
    }
    return true;
}

export const pjclECDSAGenKeyPair = pjclECCGenKeyPair;
export const pjclECDSAValidatePublicKey = pjclECCValidatePublicKey;
    
export function pjclECDSASignHashK(curve,d,hash,k,kInv) {
    // begin arg checking
    if (!pjclWellFormed(d)) {throw new Error("d not well formed in pjclECDSASignHashK ");}
    if (d.negative) {throw new Error("d negative in pjclECDSASignHashK ");}
    if (!(pjclIsBitArray(hash))) {throw new Error("hash not a bit array in pjclECDSASignHashK ");}
    if (!(hash.length >= 2 * (pjclCurveSecStrength(curve)))) {throw new Error(" hash length not adequate for security strength of (curve) ");} 
    // end arg checking    
    var n = curve.n;
    var RJacobian = pjclScalarMult(curve.G,k,curve);
    var RAffine = pjclJacobian2Affine(RJacobian,curve);
    var j = RAffine.x;
    if (pjclGreaterThanOrEqual(j,n)) {
        var r = pjclSub(j,n);
    }
    else {
        r = j;
    }
    if (r.length == 0) {
        return;
    }
    var nLength = pjclBitLengthOfBigInt(n);
    if (nLength < hash.length){
        hash = hash.concat();
        hash.length = nLength;
    }
    var e = pjclBitArray2BigInt(hash);
    var s = pjclMod(pjclMult(kInv,(pjclAdd(e,pjclMult(d,r)))),n);
    if (s.length == 0) {
        return;
    }
    return {r:r, s:s};
}

export function pjclECDSASignHash(rbgStateStorage,curve,d,hash) {
    // begin arg checking
    if (pjclRBGSecStrength(rbgStateStorage) < pjclCurveSecStrength(curve)) {throw new Error ("rbgStateStorage does not have enough security strength for (curve)");}     
    // end arg checking
    while (true) {
        var k = pjclCryptoRNG(rbgStateStorage,pjclCurveSecStrength(curve),[1],curve.n);
        var kInv = pjclModInv(k,curve.n);
        var o = pjclECDSASignHashK(curve,d,hash,k,kInv); 
        if (o !== undefined) {
            return o;
        }
    }
}

export function pjclECDSASignMsg(rbgStateStorage,curve,d,msg) {
    // begin arg checking
    if (!(pjclIsBitArray(msg))) {throw new Error("msg not a bit array in pjclECDSASignMsg");}
    // end arg checking
    if (pjclCurveSecStrength(curve) == 128) {
        return pjclECDSASignHash(rbgStateStorage,curve,d,pjclSHA256(msg));
    }
    if (pjclCurveSecStrength(curve) == 192) {
        return pjclECDSASignHash(rbgStateStorage,curve,d,pjclSHA384(msg));
    }
    throw new Error("no hash function of adequate security strength for (curve) is available"); 
}

export function pjclECDSAVerifyHash(curve,Q,hash,r,s) {
    // begin arg checking
    if (!pjclIsPoint(Q)) {throw new Error(" Q is not a point in pjclECDSAVerifyHash ");}
    if (!(pjclIsBitArray(hash))) {throw new Error("hash not a bit array in pjclECDSAVerifyHash ");}
    if (!pjclWellFormed(r)) {throw new Error("r not well formed in pjclECDSAVerifyHash ");}
    if (r.negative) {throw new Error("r negative in pjclECDSAVerifyHash ");}
    if (!pjclWellFormed(s)) {throw new Error("s not well formed in pjclECDSAVerifyHash ");}
    if (s.negative) {throw new Error("s negative in pjclECDSAVerifyHash ");}    
    // end arg checking 
    var n = curve.n;
    if (!(pjclGreaterThanRel(r,[]) && pjclGreaterThanRel(n,r) && pjclGreaterThanRel(s,[]) && pjclGreaterThanRel(n,s))) {
        return false;
    }
    var nLength = pjclBitLengthOfBigInt(n);
    if (nLength < hash.length){
        hash = hash.concat();
        hash.length = nLength;
    }
    var e = pjclBitArray2BigInt(hash);
    var w = pjclModInv(s,n);
    var u1 = pjclMod(pjclMult(e,w),n);
    var u2 = pjclMod(pjclMult(r,w),n);
    var RJacobian = pjclScalarMult2(curve.G,Q,u1,u2,curve);
    var RAffine = pjclJacobian2Affine(RJacobian,curve);
    var j = RAffine.x;
    if (pjclGreaterThanOrEqual(j,n)) {
        var v = pjclSub(j,n);
    }
    else {
        v = j;
    }
    if (pjclEqual(v,r)) {
        return true;
    }
    else {
        return false;
    }
}

export function pjclECDSAVerifyMsg(curve,Q,msg,r,s) {
    // begin arg checking
    if (!(pjclIsBitArray(msg))) {throw new Error(" msg not a bit array in pjclECDSA128Verify ");}
    // end arg checking
    if (pjclCurveSecStrength(curve) == 128) {
        return pjclECDSAVerifyHash(curve,Q,pjclSHA256(msg),r,s);
    }
    if (pjclCurveSecStrength(curve) == 192) {
        return pjclECDSAVerifyHash(curve,Q,pjclSHA384(msg),r,s);
    }
    throw new Error("no hash function of adequate security strength for (curve) is available"); 
}

export const pjclECDHGenKeyPair = pjclECCGenKeyPair;
export const pjclECDHValidatePublicKey = pjclECCValidatePublicKey;

export function pjclECDH(curve,d_A,Q_B) {
    // begin arg checking
    if (!pjclWellFormed(d_A)) {throw new Error("d not well formed in pjclECDH ");}
    if (d_A.negative) {throw new Error("d negative in pjclECDH ");}
    if (!pjclIsPoint(Q_B)) {throw new Error(" Q_B is not a point in pjclECDH");}
    if (Q_B.z.length == 0) {
        return false;
    }
    // end arg checking
    var P = pjclScalarMult(Q_B,d_A,curve);
    if (P.z.length == 0) {
        throw new Error("Invalid keys");
    }
    var z = pjclJacobian2Affine(P,curve).x;
    var Z = pjclBigInt2ByteArray(z,Math.ceil(curve.t / 8));
    return Z;
} 
