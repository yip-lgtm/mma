// Smallest valid PNG: 1x1 red pixel.
//   89 50 4E 47 0D 0A 1A 0A  -- signature
//   00 00 00 0D              -- IHDR length 13
//   49 48 44 52              -- "IHDR"
//   00 00 00 01 00 00 00 01  -- 1x1
//   08 02                    -- bit depth 8, color type 2 (RGB)
//   00 00 00                 -- compression/filter/interlace
//   1F 15 C4 89              -- CRC
//   00 00 00 0C              -- IDAT length 12
//   49 44 41 54              -- "IDAT"
//   08 99 63 F8 CF C0 00 00 00 03 00 01 -- zlib stream of 3 zero bytes (R=0 G=0 B=0)
//   5E 8D 4D 6F              -- CRC
//   00 00 00 00              -- IEND length 0
//   49 45 4E 44              -- "IEND"
//   AE 42 60 82              -- CRC
import { writeFileSync } from "node:fs";
import { Buffer } from "node:buffer";

const b64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
const png = Buffer.from(b64, "base64");
writeFileSync("/workspace/mma/test-body.png", png);
writeFileSync("/workspace/mma/test-food.png", png);
console.log("wrote", png.length, "bytes");
