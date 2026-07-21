/*
 * blockhash-core 0.1.0, adapted from CommonJS to a browser global.
 * Copyright (c) 2019 Linus Unnebäck; Copyright (c) 2014 Commons Machinery.
 * MIT License: /vendor/blockhash/LICENSE
 * Source: https://github.com/LinusU/blockhash-core
 */
(function (global) {
  "use strict";

  function median(data) {
    var values = data.slice(0);
    values.sort(function (a, b) { return a - b; });

    if (values.length % 2 === 0) {
      return (values[values.length / 2 - 1] + values[values.length / 2]) / 2.0;
    }

    return values[Math.floor(values.length / 2)];
  }

  function translateBlocksToBits(blocks, pixelsPerBlock) {
    var halfBlockValue = pixelsPerBlock * 256 * 3 / 2;
    var bandSize = blocks.length / 4;

    for (var i = 0; i < 4; i += 1) {
      var bandMedian = median(blocks.slice(i * bandSize, (i + 1) * bandSize));
      for (var j = i * bandSize; j < (i + 1) * bandSize; j += 1) {
        var value = blocks[j];
        blocks[j] = Number(value > bandMedian || (Math.abs(value - bandMedian) < 1 && bandMedian > halfBlockValue));
      }
    }
  }

  function bitsToHexhash(bitsArray) {
    var hex = [];

    for (var i = 0; i < bitsArray.length; i += 4) {
      var nibble = bitsArray.slice(i, i + 4);
      hex.push(parseInt(nibble.join(""), 2).toString(16));
    }

    return hex.join("");
  }

  function bmvbhashEven(data, bits) {
    var blockSizeX = Math.floor(data.width / bits);
    var blockSizeY = Math.floor(data.height / bits);
    var result = [];

    for (var y = 0; y < bits; y += 1) {
      for (var x = 0; x < bits; x += 1) {
        var total = 0;

        for (var imageY = 0; imageY < blockSizeY; imageY += 1) {
          for (var imageX = 0; imageX < blockSizeX; imageX += 1) {
            var currentX = x * blockSizeX + imageX;
            var currentY = y * blockSizeY + imageY;
            var offset = (currentY * data.width + currentX) * 4;
            var alpha = data.data[offset + 3];
            total += alpha === 0 ? 765 : data.data[offset] + data.data[offset + 1] + data.data[offset + 2];
          }
        }

        result.push(total);
      }
    }

    translateBlocksToBits(result, blockSizeX * blockSizeY);
    return bitsToHexhash(result);
  }

  function bmvbhash(data, bits) {
    var result = [];
    var blocks = [];
    var evenX = data.width % bits === 0;
    var evenY = data.height % bits === 0;

    if (evenX && evenY) return bmvbhashEven(data, bits);

    for (var row = 0; row < bits; row += 1) {
      blocks.push([]);
      for (var column = 0; column < bits; column += 1) blocks[row].push(0);
    }

    var blockWidth = data.width / bits;
    var blockHeight = data.height / bits;

    for (var y = 0; y < data.height; y += 1) {
      var blockTop;
      var blockBottom;
      var weightTop;
      var weightBottom;

      if (evenY) {
        blockTop = blockBottom = Math.floor(y / blockHeight);
        weightTop = 1;
        weightBottom = 0;
      } else {
        var yMod = (y + 1) % blockHeight;
        var yFrac = yMod - Math.floor(yMod);
        var yInt = yMod - yFrac;
        weightTop = 1 - yFrac;
        weightBottom = yFrac;

        if (yInt > 0 || y + 1 === data.height) {
          blockTop = blockBottom = Math.floor(y / blockHeight);
        } else {
          blockTop = Math.floor(y / blockHeight);
          blockBottom = Math.ceil(y / blockHeight);
        }
      }

      for (var x = 0; x < data.width; x += 1) {
        var offset = (y * data.width + x) * 4;
        var alpha = data.data[offset + 3];
        var averageValue = alpha === 0 ? 765 : data.data[offset] + data.data[offset + 1] + data.data[offset + 2];
        var blockLeft;
        var blockRight;
        var weightLeft;
        var weightRight;

        if (evenX) {
          blockLeft = blockRight = Math.floor(x / blockWidth);
          weightLeft = 1;
          weightRight = 0;
        } else {
          var xMod = (x + 1) % blockWidth;
          var xFrac = xMod - Math.floor(xMod);
          var xInt = xMod - xFrac;
          weightLeft = 1 - xFrac;
          weightRight = xFrac;

          if (xInt > 0 || x + 1 === data.width) {
            blockLeft = blockRight = Math.floor(x / blockWidth);
          } else {
            blockLeft = Math.floor(x / blockWidth);
            blockRight = Math.ceil(x / blockWidth);
          }
        }

        blocks[blockTop][blockLeft] += averageValue * weightTop * weightLeft;
        blocks[blockTop][blockRight] += averageValue * weightTop * weightRight;
        blocks[blockBottom][blockLeft] += averageValue * weightBottom * weightLeft;
        blocks[blockBottom][blockRight] += averageValue * weightBottom * weightRight;
      }
    }

    for (var resultRow = 0; resultRow < bits; resultRow += 1) {
      for (var resultColumn = 0; resultColumn < bits; resultColumn += 1) {
        result.push(blocks[resultRow][resultColumn]);
      }
    }

    translateBlocksToBits(result, blockWidth * blockHeight);
    return bitsToHexhash(result);
  }

  global.BlockhashCore = { bmvbhashEven: bmvbhashEven, bmvbhash: bmvbhash };
})(window);
