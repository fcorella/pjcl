/* for use in browsers that support the web crypto API */

import { pjclUI32Array2BitArray } from "./pjcl.js";

export function pjclBrowserEntropy128Bits() {
    const ui32Array = new Uint32Array(4);
    const cryptoObject = self.crypto || self.msCrypto; // for IE
    cryptoObject.getRandomValues(ui32Array);
    const bitArray = pjclUI32Array2BitArray(ui32Array);
    return bitArray;
}

export function pjclBrowserEntropy192Bits() {
    const ui32Array = new Uint32Array(6);
    const cryptoObject = self.crypto || self.msCrypto; // for IE
    cryptoObject.getRandomValues(ui32Array);
    const bitArray = pjclUI32Array2BitArray(ui32Array);
    return bitArray;
}
