  var sound = jsfx.Live(library);
  var bridgeLevel = false;
  var livesLeft = 5;
  var bombSpeed = 3;
  var projectileSpeed = 8;
  const HITS_PER_LEVEL = 10;
  var bombY;
  var bombX;
  var bombTarget = 'f';
  var projectileLive = false;
  var projectileY;
  var projectileX;
  var level = 1;
  var targetKeyIndex;
  var letterDestroyed = false;
  var bombsAway = false;
  var hitsThisLevel = 0;
  var sequenceIndex = 0;
  var indexOfNextBridgeChar = 0;
  const CHARS_IN_BRIDGE_LEVEL = 80;
  var paused = true;

  // This is in order of which level they appear
  var keys = ['f','j','d','k','s','l','a',';','g','h',
      'e','i','r','u','w','o','x',',',
      '3','8','c','m','z','.','v','n','b','\/'];

  // This can be used to generate the keyMap
  var keyboard = [['1','2','3','4','5','6','7','8','9','0','-','='],
        ['q','w','e','r','t','y','u','i','o','p','\[','\]','\\'],
        ['a','s','d','f','g','h','j','k','l',';','\''],
        ['z','x','c','v','b','n','m',',','.','\/']];

  // Stores the text for bridge level
  var bridgeText;
  // Counter used by the eater
  var bridgeLevelCounter = 0;
  var howManyBridgeLevelCharsEaten = 0;

  // Where they sit on the keyboard is generated
  var keyMap = {};

  function info(message) {
    console.log("INFO: " + message);
  }

  function debug(message) {
    // console.log("DEBUG: " + message);
  }

  function generateKeyMap() {
    debug("generating key map with keyboard " + keyboard);
    for(var i = 0; i < keyboard.length; i++) {
      var keyboardRow = keyboard[i];
      debug("got the keyboardRow " + keyboardRow);
      for(var j = 0; j < keyboardRow.length; j++) {
        var key = keyboardRow[j];
        debug("Adding key " + key + " at " + i + "," + j);
        keyMap[key] = {'col': j, 'row': i};
      }
    }
  }

  String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
  }

  function updateKeyPress(evt) {
    var keypressedChar = charFor(evt.which);
    if (paused) {
      paused = false;
      return;
    }
    if (isBridgeLevel()) {
      var nextChar = bridgeText.charAt(indexOfNextBridgeChar);
      debug("Trying to remove char at " + indexOfNextBridgeChar + " which is " + nextChar);
      if (keypressedChar == nextChar) {
        if (indexOfNextBridgeChar >= CHARS_IN_BRIDGE_LEVEL - 1) {
          finishedBridgeLevel();
        } else {
          bridgeText = bridgeText.replaceAt(indexOfNextBridgeChar, " ");
          indexOfNextBridgeChar++;
        }
      }
    } else {
      if (projectileLive == false) {
        var indexOfKeyPressed = keys.indexOf(keypressedChar);
        if ((indexOfKeyPressed >= 0) && (indexOfKeyPressed < noKeysInPlay())) {
          shootAt(keypressedChar);
        }
      }
    }
  }

  function shootAt(key) {
    sound.pewpew();
    info("Getting co-ords for \'" + key + "\'.");
    projectileY = yForKey(key);
    projectileX = xForKey(key);
    projectileLive = true;
  }

  function finishedBridgeLevel() {
    info("Succeed!");
    bridgeLevel = false;
    bridgeText = false;
    indexOfNextBridgeChar = 0;
  }

  function charFor(which) {
    var keysNotMappingProperly = {
      186 : ';',
      188 : ',',
      190 : '.'
    };
    var keypressedChar = keysNotMappingProperly[which] || String.fromCharCode(which).toLowerCase();
    info("Key code " + which + " is " + keypressedChar);
    return keypressedChar;
  }

  function updateAll() {
    if (livesLeft <= 0) {
      gameOver();
    } else {
      drawCanvas();
      if (paused) {
        colorText('Start with your index fingers on \'f\' and \'j\'', 60, 140, 'white');
        drawPaused();
      } else if (isBridgeLevel()) {
        moveAllBridge();
        drawAllBridge();
      } else {
        moveAll();
        drawAll();
      }
    }
  }

  function drawPaused() {
    // colorText('Paused', 320, 340, 'white',40);
    colorText('Press any key to continue...', 120, 260, 'white');
  }

  function isBridgeLevel() {
    return bridgeLevel;
  }

  function getBridgeText() {
    if (bridgeText) return bridgeText;

    var total_text = "aaa ;;; sss lll ddd kkk fff jjj " +
      "aa ss dd ff aa ss dd ff " +
      ";; ll kk jj ;; ll kk jj " +
      "ad ad as as ask ask ad ad as as ask ask " +
      ";;; lll kkk jjj ;;; lll kkk jjj " +
      ";;; lll kkk jjj ;;; lll kkk jjj " +
      "add add fad fad jak jak sad sad fall fall jak jak " +
      "add fad; add fad; add jak; add jak; sad fall; sad fall; " +
      "a a as as fad fad dad dad ;; ;; ja ja ka ka la la " +
      "jas jas kas kas las las jas jas kas kas las las jas jas " +
      "jf kd ls ;a jf kd ls ;a jf kd ls ;a jf kd ls ;a " +
      "fall fall sad sad all all all sad falls; all sad falls; " +
      "lad lad asks asks sas sas kass kass " +
      "lad asks sas kass; lad asks sas kass; " +
      "a a sad sad dad dad fall fall; a sad dad fall; " +
      "dad dad sad sad kad kad lad lad " +
      "dad dad; sad sad; kad kad; lad lad; " +
      "lad; dad; sad; lass; lad; dad; sad; lass; " +
      "fad fad; ads ads; all all; fad ads all lads; " +
      "ask a lad; a fall ad; ask a dad; " +
      "as a lad; as a dad; as a sad lass;  ";

    var randy = Math.floor(Math.random() * (total_text.length - CHARS_IN_BRIDGE_LEVEL));
    debug("Returning text starting at " + randy);
    return total_text.substring(randy, randy + CHARS_IN_BRIDGE_LEVEL);
  }

  function drawAllBridge() {
    const CHARS_PER_LINE = 50;
    const explosionSequence = ['\\','-','/','|','\\','-','/','|'];
    var trailingChar;
    var explosionIndex = Math.floor(bridgeLevelCounter / 3) % explosionSequence.length;
    trailingChar = explosionSequence[explosionIndex];

    bridgeText = getBridgeText();
    var bridgeLines = bridgeText.concat(trailingChar).match(/.{1,50}/g);
    var lineY = 200;
    // This works because we're using a mono space font
    var width = canvasContext.measureText(bridgeText.charAt(indexOfNextBridgeChar)).width;
    var charIndex = indexOfNextBridgeChar % CHARS_PER_LINE;
    var underlineX = 30 + (width * charIndex);
    var underlineY = lineY + (25 * Math.floor(indexOfNextBridgeChar / CHARS_PER_LINE));
    underline(canvasContext," ",underlineX,underlineY,5,"white",2,"center");
    for (var i = 0; i < bridgeLines.length; i++) {
      colorText(bridgeLines[i], 30, lineY, 'white');
      lineY += 25;
    }
  }

  function moveAllBridge() {
    bridgeLevelCounter++;
    info("Updating how many eaten chars to " + howManyBridgeLevelCharsEaten);
    debug("Update bridge level counter " + bridgeLevelCounter);
    if (bridgeLevelCounter >= 30 * 4) {
      debug("Hit the greater than 4 minutes threshold");
      if((bridgeLevelCounter % 30) == 0) {
        howManyBridgeLevelCharsEaten++;
        bridgeText = getBridgeText().slice(0,-1);
      }
    }
    if (indexOfNextBridgeChar >= (CHARS_IN_BRIDGE_LEVEL - howManyBridgeLevelCharsEaten)) {
      finishedBridgeLevel();
    }
  }

  function moveAll() {
    moveBomb();

    moveProjectile();

    projectileBombHandling();

    projectileLetterHandling();
  }

  function gameOver() {
    colorText('GAME OVER', 180, 160, 'white',40);
    colorText('Refresh page to start again.', 135, 200, 'white');
    info("Game over");
    // paused = true;
    // livesLeft = 3;
  }

  function projectileBombHandling() {
    // projectile gets less going up, bomb gets more going down
    if (projectileLive && (projectileY < bombY) && (projectileX == bombX)) {
      sound.hit();
      info("Bullseye!");
      hitsThisLevel++;
      if(hitsThisLevel >= HITS_PER_LEVEL) {
        if (level % 4 == 0)
          startBridgeLevel();
        level++;
        hitsThisLevel = 0;
      }
      projectileLive = false;
      bombsAway = false;
    }
  }

  function startBridgeLevel() {
    info("Start bridge level after level " + level);
    bridgeLevel = true;
  }

  function moveProjectile() {
    if (projectileLive) {
      projectileY -= projectileSpeed;
      if (projectileY < 0) {
        projectileLive = false;
      }
    }
  }

  function moveBomb() {
    bombY += bombSpeed;
  }

  function projectileLetterHandling() {
    if (bombsAway) {
      var targetKey = keys[targetKeyIndex];
      var targetKeyY = yForKey(targetKey);
      debug("For key " + targetKey + ", Is " + bombY + " >= " + targetKeyY);
      if (bombY >= targetKeyY) {
        sound.destroyed();
        debug("Letter destroyed!");
        livesLeft -= 1;
        bombsAway = false;
        letterDestroyed = targetKey;
        dropBomb();
      }
    }
  }

  function dropBomb() {
    if (!bombsAway) {
      bombY = 0;
      var randy = Math.random() * noKeysInPlay();
      targetKeyIndex = Math.floor(randy);
      bombsAway = true;
      var targetKey = keys[targetKeyIndex];
      bombX = xForKey(targetKey);
    } else {
      debug("Aiming at " + targetKeyIndex);
      colorText('#', bombX, bombY, 'white'); // draw bomb
    }
  }

  function drawCanvas() {
    colorRect(0, 0, canvas.width, canvas.height, 'black'); // clear screen
  }

  function drawAll() {
    for (var j = 1; j <= livesLeft; j++) {
      var x = 20 * j;
      colorText('\u2764', x, 30, 'white'); // draw bomb
    }

    dropBomb();

    // draw projectile
    debug("Projectile x is " + projectileX + "," + projectileY);
    if (projectileLive) {
      colorText('|', projectileX, projectileY, 'white');
    }

    drawKeys();

    if (letterDestroyed) {
      drawExplosions();
    }
  }

  function drawExplosions() {
    sequenceIndex++;
    var charToDraw = Math.floor(sequenceIndex / 3);
    // var explosionSequence = ['$','%','@','!','*'];
    var explosionSequence = ['#','/','-','\\','|','/','-','\\','|'];
    if (sequenceIndex >= (explosionSequence.length - 1) * 3) {
      letterDestroyed = false;
      sequenceIndex = 0;
    }

    var destroyedX = xForKey(letterDestroyed);
    var destroyedY = yForKey(letterDestroyed);
    colorText(explosionSequence[charToDraw], destroyedX, destroyedY, 'white');
  }

  function noKeysInPlay() {
    return level * 2;
  }

  function drawKeys() {
    for (var i = 0; i < noKeysInPlay(); i++) {
      var key = keys[i];
      var keyX = xForKey(key);
      var keyY = yForKey(key);

      debug("For index " + i + " drawing key " + key + " at " + keyX + "," + keyY);
      if (letterDestroyed == key) {
        continue;
      }
      colorText(keys[i], keyX, keyY, 'white'); // draw keys
    }
  }

  function yForKey(key) {
    const ROW_MARGIN = 260;
    const ROW_GAP = 20;

    return keyMap[key].row * ROW_GAP + ROW_MARGIN;
  }

  function xForKey(key) {
    const COL_MARGIN = 0;
    const COL_GAP = 66;
    const OFFSET = 16;

    return keyMap[key].col * COL_GAP + COL_MARGIN + (OFFSET * keyMap[key].row);
  }

  function colorRect(topLeftX, topLeftY, boxWidth, boxHeight, fillColor) {
    canvasContext.fillStyle = fillColor;
    canvasContext.fillRect(topLeftX, topLeftY, boxWidth, boxHeight);
  }

  function colorCircle(centerX, centerY, radius, fillColor) {
    canvasContext.fillStyle = fillColor;
    canvasContext.beginPath();
    canvasContext.arc(centerX, centerY, radius, 0, Math.PI*2, true);
    canvasContext.fill();
  }

  function colorText(showWords, textX, textY, fillColor, size) {
    if (!size) {
      canvasContext.font="16px Courier New";
    } else {
      canvasContext.font=size + "px Arial";
    }

    canvasContext.fillStyle = fillColor;
    canvasContext.fillText(showWords, textX, textY);
  }

  function underline(ctx, text, x, y, size, color, thickness ,offset) {
    info("Underline invoked with " + text + ", " + x + ", " + y + ", " + size + ", " + color + ", " + thickness + ", " + offset + ", " + ctx.textAlign);
    var width = ctx.measureText(text).width;

    switch(offset){
      case "center":
      x -= (width/2); break;
      case "right":
      x -= width; break;
      case "left":
      x += width; break;
    }

    // y += size+offset;
    info("Y is " + y + ", size is " + size);
    y += size;

    info("Drawing underline from " + x + ", " + y + " of length " + width);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.moveTo(x,y);
    ctx.lineTo(x+width,y);
    ctx.stroke();
  }
