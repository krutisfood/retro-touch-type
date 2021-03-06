(function(touch){
  // 'use strict';

  var canvas;
  var canvasContext;
  var sound = jsfx.Live(library);
  var bridgeLevel = false;
  var livesLeft = 3;
  var bombSpeed = 5;
  var projectileSpeed = 10;
  const HITS_PER_LEVEL = 8;
  var bombY;
  var bombX;
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
  var lastWpm = 0;
  var framesPerSecond = 30;
  var muted = false;

  // This defines the order in which keys appear
  var keys = 'fjdksla;' +
    'ghrueiwo' +
    'qptyvncm' +
    'x,z.b\/38' +
    '47291056\[';

  // This is used to generate where they appear on screen
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

  touch.start = function (gameCanvas) {
    generateKeyMap();
    canvas = gameCanvas;
    canvasContext = canvas.getContext('2d');

    setInterval(updateAll, 1000/framesPerSecond);

    window.addEventListener('keydown', updateKeyPress, false);
  };

  function error(message) {
    console.log("ERROR: " + message);
  }

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
      if (keypressedChar === nextChar) {
        if (indexOfNextBridgeChar >= CHARS_IN_BRIDGE_LEVEL - 1) {
          finishedBridgeLevel();
        } else {
          bridgeText = bridgeText.replaceAt(indexOfNextBridgeChar, " ");
          indexOfNextBridgeChar++;
        }
      }
    } else {
      if (projectileLive === false) {
        var indexOfKeyPressed = keys.indexOf(keypressedChar);
        if ((indexOfKeyPressed >= 0) && (indexOfKeyPressed < noKeysInPlay())) {
          shootAt(keypressedChar);
        }
      }
    }
  }

  function shootAt(key) {
    play(sound.pewpew);
    info("Getting co-ords for \'" + key + "\'.");
    projectileY = yForKey(key);
    projectileX = xForKey(key);
    projectileLive = true;
  }

  function finishedBridgeLevel() {
    info("Succeed bridge level!");
    bridgeLevel = false;
    bridgeText = false;
    indexOfNextBridgeChar = 0;
    howManyBridgeLevelCharsEaten = 0;
    bridgeLevelCounter = 0;
    paused = true;
  }

  function charFor(which) {
    var keysNotMappingProperly = {
      186 : ';',
      188 : ',',
      190 : '.'
    };
    var keypressedChar = keysNotMappingProperly[which] || String.fromCharCode(which).toLowerCase();
    debug("Key code " + which + " is " + keypressedChar);
    return keypressedChar;
  }

  function updateAll() {
    if (livesLeft <= 0) {
      gameOver();
    } else if(noKeysInPlay() >= keys.length) {
      error("Comparing " + noKeysInPlay() + " with " + keys.length);
      playerWon();
    } else {
      drawCanvas();
      if (paused) {
	if (level === 1) {
          drawIntroText();
	} else {
          colorText("You typed at " + lastWpm + " words per minute", 140, 140, 'white');
	} drawPaused();
      } else if (isBridgeLevel()) {
        moveAllBridge(); // TODO this determines that bridge level is done but it continues on to draw...
        drawAllBridge();
      } else {
        moveAll();
        drawAll();
      }
    }
  }

  function drawIntroText() {
    colorText("Place your index fingers on \'f\' and \'j\'", 80, 100, 'white');
    colorText("Middle fingers on \'d\' and \'k\'", 80, 120, 'white');
    colorText("Ring fingers on \'s\' and \'l\'", 80, 140, 'white');
    colorText("Pinky fingers on \'a\' and \';\'", 80, 160, 'white');
    colorText("Your fingers are now on the home row, bring your fingers", 80, 180, 'white');
    colorText("back here when they've finished typing a letter.", 80, 200, 'white');
  }

  function drawPaused() {
    colorText('Press any key to continue...', 160, 260, 'white');
  }

  function isBridgeLevel() {
    return bridgeLevel;
  }

  function getBridgeText() {
    debug("Get bridge text " + bridgeText);
    if (bridgeText) return bridgeText;

    var texts = [
      "aaa ;;; sss lll ddd kkk fff jjj " +
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
      "as a lad; as a dad; as a sad lass; ",

      "a;sldkfja;sldkfjaa;;ssllddkkffjj" +
      "ghrueiwo; how wow row aeiou grr grow" +
      "ear rae low" +
      "woeiru wood grue hi hello " +
      "jjjhhhjjjhhhjhjjhjjhjjhjaaahhhaaahhhahahhaha" +
      "jhjhjhjhjhjhahahahahahahhadhadhasasashash" +
      "ahahhaha;hadhadhasash;hashadahall;ashadahall;" +
      "dddeeedddeeededdeddeddedelelledledeeleelekeeke" +
      "edeedeedeedeleeleeleeleefedfedfedfedekeekeekeeke" +
      "alake;alake;aleek;aleek;ajade;ajade;adeskadesk;" +
      "he he she she shed shed heed heed held held he she shed heed held" +
      "he held a lash; she held a jade; he she held sash;" +
      "he has fled; he has a sale; she has a sale; he as ash;" +
      "ask ask has has lad lad all all fall falls" +
      "a sash; had all; a fall jak; a lad sash;" +
      "he he she she led led held held she she fell fell" +
      "he he led led; she she had had; she she fell fell;" +
      "a jade shelf; a jade desk shelf;; she had a shed;" +
      "he sells desks; she sells desks; he sells jade;" +
      "he led; she led; he as jade; she has jade;" +
      "she asked a lad; he asked a lass; she fell; he fell;" +
      "hero great grate gate fate irate wool would",

      "quiet loop pool yes vet not come here yet yes" +
      "quiet quell question queen more pool poor rope" ];

/*  var keys = 'fjdksla;' +
    'ghrueiwo' +
    'qptyvncm' +
    'x,z.b\/38' +
    '47291056\[';
   */

    var textIndex = bridgeLevelIndex(texts.length, level);
    var total_text = texts[textIndex];
    var randy = Math.floor(Math.random() * (total_text.length - CHARS_IN_BRIDGE_LEVEL));
    debug("Returning text starting at " + randy);
    return total_text.substring(randy, randy + CHARS_IN_BRIDGE_LEVEL);
  }

  function drawAllBridge() {
    if (!bridgeLevel) return;
    const CHARS_PER_LINE = 60;
    const explosionSequence = ['\\','-','/','|','\\','-','/','|'];
    var trailingChar;
    var explosionIndex = Math.floor(bridgeLevelCounter / 3) % explosionSequence.length;
    trailingChar = explosionSequence[explosionIndex];

    // bridgeText = getBridgeText();
    var bridgeLines = bridgeText.concat(trailingChar).match(/.{1,60}/g);
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
    debug("Update bridge level counter " + bridgeLevelCounter);
    if (bridgeLevelCounter >= 30 * 10) {
      debug("Hit the greater than 4 minutes threshold");
      if((bridgeLevelCounter % 10) === 0) {
        debug("Updating how many eaten chars to " + howManyBridgeLevelCharsEaten);
        howManyBridgeLevelCharsEaten++;
        bridgeText = getBridgeText().slice(0,-1);
      }
    }
    // WPM = (chars typed / 5) / time
    // Refresh is hard coded (ugh) to 30/sec

    var elapsedMinutes = (bridgeLevelCounter / (framesPerSecond * 60));
    lastWpm = Math.floor((indexOfNextBridgeChar / 5) / elapsedMinutes);
    debug("last WPM is set to " + lastWpm);
    debug("elapsedMinutes " + elapsedMinutes + ", indexOfNextBridgeChar " + indexOfNextBridgeChar);

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

  function playerWon() {
    gameOver(true);
  }

  function gameOver(playerWon) {
    if(playerWon) {
      colorText('CONGRATULATIONS!', 120, 100, 'white',40);
      colorText('YOU WON!!!', 180, 160, 'white',40);
    } else {
      colorText('GAME OVER', 180, 160, 'white',40);
    }
    colorText('Refresh page to start again.', 170, 200, 'white');
    info("Game over");
    // paused = true;
    // livesLeft = 3;
  }

  function projectileBombHandling() {
    // projectile gets less going up, bomb gets more going down
    if (projectileLive && (projectileY < bombY) && (projectileX === bombX)) {
      play(sound.hit);
      info("Bullseye!");
      hitsThisLevel++;
      if(hitsThisLevel >= HITS_PER_LEVEL) {
        if (level % 4 === 0)
          startBridgeLevel();
        level++;
        hitsThisLevel = 0;
      }
      projectileLive = false;
      bombsAway = false;
    }
  }

  function bridgeLevelIndex(numberOfBridgeTexts, level) {
    var index = (level / 4);
    info("In looking for bridgeLevelIndex we've got index of " + index + ", level " + level);
    if (index > numberOfBridgeTexts)
      return numberOfBridgeTexts - 1;
    return Math.floor(index) - 1;
  }

  function startBridgeLevel() {
    info("Start bridge level after level " + level);
    bridgeLevel = true;
    bridgeText = getBridgeText();
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
        play(sound.destroyed);
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
      info('Dropping bomb, getting x for key ' + targetKey);
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
    } else {
      info('Drawing explosion, getting x for key ' + letterDestroyed);
      var destroyedX = xForKey(letterDestroyed);
      var destroyedY = yForKey(letterDestroyed);
      colorText(explosionSequence[charToDraw], destroyedX, destroyedY, 'white');
    }
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
      var keyColour = 'grey';
      if (targetKeyIndex === i) {
        keyColour = 'white';
      }
      colorText(keys[i], keyX, keyY, keyColour); // draw keys
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
    debug("Underline invoked with " + text + ", " + x + ", " + y + ", " + size + ", " + color + ", " + thickness + ", " + offset + ", " + ctx.textAlign);
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
    debug("Y is " + y + ", size is " + size);
    y += size;

    debug("Drawing underline from " + x + ", " + y + " of length " + width);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.moveTo(x,y);
    ctx.lineTo(x+width,y);
    ctx.stroke();
  }

  function play(sound) {
    if(!muted) {
      try {
        sound();
      } catch(err) {
        // Better than figuring out which browser & assuming IE can't play sounds
	error("Sound failed with error " + err);
      }
    }
  }
})(this.touch = {});
