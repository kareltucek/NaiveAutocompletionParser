import { ParserBuilder } from "./parser_builder";

export let testGrammar2 = `
BODY = //<comment>
BODY = [LABEL:] COMMAND [//<comment>]
COMMAND = [CONDITION|MODIFIER]* COMMAND
COMMAND = delayUntilRelease
COMMAND = delayUntil <timeout (INT)>
COMMAND = delayUntilReleaseMax <timeout (INT)>
COMMAND = switchKeymap KEYMAPID
COMMAND = toggleLayer LAYERID
COMMAND = toggleKeymapLayer KEYMAPID LAYERID
COMMAND = untoggleLayer
COMMAND = holdLayer LAYERID
COMMAND = holdLayerMax LAYERID <time in ms (INT)>
COMMAND = holdKeymapLayer KEYMAPID LAYERID
COMMAND = holdKeymapLayerMax KEYMAPID LAYERID <time in ms (INT)>
COMMAND = overlayKeymap KEYMAPID
COMMAND = overlayLayer <target layer (LAYERID)> <source keymap (KEYMAPID)> <source layer (LAYERID)>
COMMAND = replaceLayer <target layer (LAYERID)> <source keymap (KEYMAPID)> <source layer (LAYERID)>
COMMAND = resolveNextKeyId
COMMAND = activateKeyPostponed [atLayer LAYERID] [append | prepend]  KEYID
COMMAND = consumePending <number of keys (INT)>
COMMAND = postponeNext <number of commands (NUMER)>
COMMAND = break
COMMAND = exit
COMMAND = noOp
COMMAND = yield
COMMAND = {exec|call|fork} MACRONAME
COMMAND = resetTrackpoint
COMMAND = printStatus
COMMAND = setLedTxt <timeout (INT)> { STRING | EXPRESSION }
COMMAND = write STRING
COMMAND = goTo <index (ADDRESS)>
COMMAND = repeatFor <var name (IDENTIFIER)> <action adr (ADDRESS)>
COMMAND = progressHue
COMMAND = recordMacroDelay
COMMAND = {startRecording | startRecordingBlind} [<slot identifier (MACROID)>]
COMMAND = {recordMacro | recordMacroBlind} [<slot identifier (MACROID)>]
COMMAND = {stopRecording | stopRecordingBlind}
COMMAND = playMacro [<slot identifier (MACROID)>]
COMMAND = {startMouse|stopMouse} {move DIRECTION|scroll DIRECTION|accelerate|decelerate}
COMMAND = setVar <var name (IDENTIFIER)> <value (PARENTHESSED_EXPRESSION)>
COMMAND = {pressKey|holdKey|tapKey|releaseKey} SHORTCUT
COMMAND = tapKeySeq [SHORTCUT]+
COMMAND = set module.MODULEID.navigationMode.LAYERID_BASIC NAVIGATION_MODE
COMMAND = set module.MODULEID.baseSpeed <speed multiplier part that always applies, 0-10.0 (FLOAT)>
COMMAND = set module.MODULEID.speed <speed multiplier part that is affected by xceleration, 0-10.0 (FLOAT)>
COMMAND = set module.MODULEID.xceleration <exponent 0-1.0 (FLOAT)>
COMMAND = set module.MODULEID.caretSpeedDivisor <1-100 (FLOAT)>
COMMAND = set module.MODULEID.scrollSpeedDivisor <1-100 (FLOAT)>
COMMAND = set module.MODULEID.axisLockSkew <0-2.0 (FLOAT)>
COMMAND = set module.MODULEID.axisLockFirstTickSkew <0-2.0 (FLOAT)>
COMMAND = set module.MODULEID.scrollAxisLock BOOL
COMMAND = set module.MODULEID.cursorAxisLock BOOL
COMMAND = set module.MODULEID.caretAxisLock BOOL
COMMAND = set module.MODULEID.swapAxes BOOL
COMMAND = set module.MODULEID.invertScrollDirectionX BOOL
COMMAND = set module.MODULEID.invertScrollDirectionY BOOL
COMMAND = set module.touchpad.pinchZoomDivisor <1-100 (FLOAT)>
COMMAND = set module.touchpad.pinchZoomMode NAVIGATION_MODE
COMMAND = set module.touchpad.holdContinuationTimeout <0-65535 (INT)>
COMMAND = set secondaryRole.defaultStrategy { simple | advanced }
COMMAND = set secondaryRole.advanced.timeout <ms, 0-500 (INT)>
COMMAND = set secondaryRole.advanced.timeoutAction { primary | secondary }
COMMAND = set secondaryRole.advanced.safetyMargin <ms, -50 - 50 (INT)>
COMMAND = set secondaryRole.advanced.triggerByRelease BOOL
COMMAND = set secondaryRole.advanced.doubletapToPrimary BOOL
COMMAND = set secondaryRole.advanced.doubletapTime <ms, 0 - 500 (INT)>
COMMAND = set mouseKeys.{move|scroll}.initialSpeed <px/s, -100/20 (INT)>
COMMAND = set mouseKeys.{move|scroll}.baseSpeed <px/s, -800/20 (INT)>
COMMAND = set mouseKeys.{move|scroll}.initialAcceleration <px/s, ~1700/20 (INT)>
COMMAND = set mouseKeys.{move|scroll}.deceleratedSpeed <px/s, ~200/10 (INT)>
COMMAND = set mouseKeys.{move|scroll}.acceleratedSpeed <px/s, ~1600/50 (INT)>
COMMAND = set mouseKeys.{move|scroll}.axisSkew <multiplier, 0.5-2.0 (FLOAT)>
COMMAND = set i2cBaudRate <baud rate, default 100000(INT)>
COMMAND = set diagonalSpeedCompensation BOOL
COMMAND = set chordingDelay <time in ms (INT)>
COMMAND = set autoShiftDelay <time in ms (INT)>
COMMAND = set stickyModifiers {never|smart|always}
COMMAND = set debounceDelay <time in ms, at most 250 (INT)>
COMMAND = set doubletapTimeout <time in ms, at most 65535 (INT)>
COMMAND = set keystrokeDelay <time in ms, at most 65535 (INT)>
COMMAND = set autoRepeatDelay <time in ms, at most 65535 (INT)>
COMMAND = set autoRepeatRate <time in ms, at most 65535 (INT)>
COMMAND = set oneShotTimeout <time in ms, at most 65535 (INT)>
COMMAND = set macroEngine.batchSize <number of commands to execute per one update cycle INT>
COMMAND = set navigationModeAction.NAVIGATION_MODE_CUSTOM.DIRECTION ACTION
COMMAND = set keymapAction.LAYERID.KEYID ACTION
COMMAND = set backlight.strategy { functional | constantRgb | perKeyRgb }
COMMAND = set backlight.constantRgb.rgb <number 0-255 (INT)> <number 0-255 (INT)> <number 0-255 (INT)><number 0-255 (INT)>
COMMAND = set backlight.keyRgb.LAYERID.KEYID <number 0-255 (INT)> <number 0-255 (INT)> <number 0-255 (INT)>
COMMAND = set leds.enabled BOOL
COMMAND = set leds.brightness <0-1 multiple of default (FLOAT)>
COMMAND = set leds.fadeTimeout <seconds to fade after (INT)>
COMMAND = set modifierLayerTriggers.{shift|alt|super|ctrl} {left|right|both}
CONDITION = if (EXPRESSION)
CONDITION = else
CONDITION = {ifShortcut | ifNotShortcut} [IFSHORTCUT_OPTIONS]* [KEYID]+
CONDITION = {ifGesture | ifNotGesture} [IFSHORTCUT_OPTIONS]* [KEYID]+
CONDITION = {ifPrimary | ifSecondary} [ simpleStrategy | advancedStrategy ]
CONDITION = {ifDoubletap | ifNotDoubletap}
CONDITION = {ifInterrupted | ifNotInterrupted}
CONDITION = {ifReleased | ifNotReleased}
CONDITION = {ifKeyActive | ifNotKeyActive} KEYID
CONDITION = {ifKeyDefined | ifNotKeyDefined} KEYID
CONDITION = {ifKeyPendingAt | ifNotKeyPendingAt} <idx in buffer (INT)> KEYID
CONDITION = {ifPending | ifNotPending} <n (INT)>
CONDITION = {ifPendingKeyReleased | ifNotPendingKeyReleased} <queue idx (INT)>
CONDITION = {ifPlaytime | ifNotPlaytime} <timeout in ms (INT)>
CONDITION = {ifShift | ifAlt | ifCtrl | ifGui | ifAnyMod | ifNotShift | ifNotAlt | ifNotCtrl | ifNotGui | ifNotAnyMod}
CONDITION = {ifCapsLockOn | ifNotCapsLockOn | ifScrollLockOn | ifNotScrollLockOn | ifNumLockOn | ifNotNumLockOn}
CONDITION = {ifKeymap | ifNotKeymap} KEYMAPID
CONDITION = {ifLayer | ifNotLayer} LAYERID
CONDITION = {ifRecording | ifNotRecording}
CONDITION = {ifRecordingId | ifNotRecordingId} MACROID
CONDITION = {ifModuleConnected | ifNotModuleConnected} MODULEID
MODIFIER = suppressMods
MODIFIER = postponeKeys
MODIFIER = final
MODIFIER = autoRepeat
MODIFIER = oneShot
IFSHORTCUT_OPTIONS = noConsume | transitive | anyOrder | orGate | timeoutIn <time in ms (INT)> | cancelIn <time in ms(INT)>
DIRECTION = {left|right|up|down}
LAYERID = {fn|mouse|mod|base|fn2|fn3|fn4|fn5|alt|shift|super|ctrl}|last|previous
LAYERID_BASIC = {fn|mouse|mod|base|fn2|fn3|fn4|fn5}
KEYMAPID = <abbrev>|last
MACROID = last|CHAR|INT
OPERATOR = + | - | * | / | % | < | > | <= | >= | == | != | && | ||
VARIABLE_EXPANSION = $<variable name> | $<config value name> | $currentAddress | $thisKeyId | $queuedKeyId.<queue index (INT)> | $keyId.KEYID_ABBREV
EXPRESSION = (EXPRESSION) | INT | BOOL | FLOAT | VARIABLE_EXPANSION | EXPRESSION OPERATOR EXPRESSION | !EXPRESSION | min(EXPRESSION [, EXPRESSION]+) | max(EXPRESSION [, EXPRESSION]+)
PARENTHESSED_EXPRESSION = (EXPRESSION)
INT = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | [0-9]+ | -[0-9]+
BOOL = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | 0 | 1
FLOAT = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | [0-9]*.[0-9]+ | -FLOAT
VALUE = INT | BOOL | FLOAT
STRING = "<interpolated string>" | '<literal string>'
IDENTIFIER = [a-zA-Z0-9_]+
CHAR = <any nonwhite ascii char>
LABEL = <string identifier>
MODMASK = [MODMASK]+ | [L|R]{S|C|A|G} | {p|r|h|t} | {s|i|o}
NAVIGATION_MODE = cursor | scroll | caret | media | zoom | zoomPc | zoomMac | none
NAVIGATION_MODE_CUSTOM = caret | media | zoomPc | zoomMac
MODULEID = trackball | touchpad | trackpoint | keycluster
ADDRESS = LABEL | INT
ACTION = { macro MACROID | keystroke SHORTCUT | none }
SCANCODE = CHAR | SCANCODE_ABBREV
SHORTCUT = MODMASK- | MODMASK-SCANCODE | SCANCODE | MODMASK
SCANCODE_ABBREV = enter | escape | backspace | tab | space | minusAndUnderscore | equalAndPlus | openingBracketAndOpeningBrace | closingBracketAndClosingBrace
SCANCODE_ABBREV = backslashAndPipeIso | backslashAndPipe | nonUsHashmarkAndTilde | semicolonAndColon | apostropheAndQuote | graveAccentAndTilde | commaAndLessThanSign
SCANCODE_ABBREV = dotAndGreaterThanSign | slashAndQuestionMark | capsLock | printScreen | scrollLock | pause | insert | home | pageUp | delete | end | pageDown | numLock
SCANCODE_ABBREV = nonUsBackslashAndPipe | application | power | keypadEqualSign |  execute | help | menu | select | stop | again | undo | cut | copy | paste | find | mute
SCANCODE_ABBREV = volumeUp | volumeDown | lockingCapsLock | lockingNumLock | lockingScrollLock | keypadComma | keypadEqualSignAs400 | international1 | international2
SCANCODE_ABBREV = international3 | international4 | international5 | international6 | international7 | international8 | international9 | lang1 | lang2 | lang3 | lang4 | lang5
SCANCODE_ABBREV = lang6 | lang7 | lang8 | lang9 | alternateErase | sysreq | cancel | clear | prior | return | separator | out | oper | clearAndAgain | crselAndProps | exsel
SCANCODE_ABBREV = keypad00 | keypad000 | thousandsSeparator | decimalSeparator | currencyUnit | currencySubUnit | keypadOpeningParenthesis | keypadClosingParenthesis
SCANCODE_ABBREV = keypadOpeningBrace | keypadClosingBrace | keypadTab | keypadBackspace | keypadA | keypadB | keypadC | keypadD | keypadE | keypadF | keypadXor | keypadCaret
SCANCODE_ABBREV = keypadPercentage | keypadLessThanSign | keypadGreaterThanSign | keypadAmp | keypadAmpAmp | keypadPipe | keypadPipePipe | keypadColon | keypadHashmark
SCANCODE_ABBREV = keypadSpace | keypadAt | keypadExclamationSign | keypadMemoryStore | keypadMemoryRecall | keypadMemoryClear | keypadMemoryAdd | keypadMemorySubtract
SCANCODE_ABBREV = keypadMemoryMultiply | keypadMemoryDivide | keypadPlusAndMinus | keypadClear | keypadClearEntry | keypadBinary | keypadOctal | keypadDecimal
SCANCODE_ABBREV = keypadHexadecimal | keypadSlash | keypadAsterisk | keypadMinus | keypadPlus | keypadEnter | keypad1AndEnd | keypad2AndDownArrow | keypad3AndPageDown
SCANCODE_ABBREV = keypad4AndLeftArrow | keypad5 | keypad6AndRightArrow | keypad7AndHome | keypad8AndUpArrow | keypad9AndPageUp | keypad0AndInsert | keypadDotAndDelete
SCANCODE_ABBREV = leftControl | leftShift | leftAlt | leftGui | rightControl | rightShift | rightAlt | rightGui
SCANCODE_ABBREV = up | down | left | right | upArrow | downArrow | leftArrow | rightArrow
SCANCODE_ABBREV = np0 | np1 | np2 | np3 | np4 | np5 | np6 | np7 | np8 | np9
SCANCODE_ABBREV = f1 | f2 | f3 | f4 | f5 | f6 | f7 | f8 | f9 | f10 | f11 | f12 | f13 | f14 | f15 | f16 | f17 | f18 | f19 | f20 | f21 | f22 | f23 | f24
SCANCODE_ABBREV = mediaVolumeMute | mediaVolumeUp | mediaVolumeDown | mediaRecord | mediaFastForward | mediaRewind | mediaNext | mediaPrevious | mediaStop | mediaPlayPause | mediaPause
SCANCODE_ABBREV = systemPowerDown | systemSleep | systemWakeUp
SCANCODE_ABBREV = mouseBtnLeft | mouseBtnRight | mouseBtnMiddle | mouseBtn4 | mouseBtn5 | mouseBtn6 | mouseBtn7 | mouseBtn8
KEYID = INT | KEYID_ABBREV | KEYID_ABBREV_UGLY
KEYID_ABBREV = ' | , | - | . | / | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | ; | = |  
KEYID_ABBREV = a | q | w | e | r | t | y | u | i | o | p | a | s | d | f | g | h | j | k | l | z | x | c | v | b | n | m
KEYID_ABBREV = apostropheAndQuote | backspace | capsLock | closingBracketAndClosingBrace | commaAndLessThanSign | dotAndGreaterThanSign | enter
KEYID_ABBREV = equalAndPlus | graveAccentAndTilde | isoKey | semicolonAndColon | slashAndQuestionMark | tab | minusAndUnderscore | openingBracketAndOpeningBrace
KEYID_ABBREV = leftAlt | leftCtrl | leftFn | leftMod | leftMouse | leftShift | leftSpace | leftSuper
KEYID_ABBREV = leftModule.key1 | leftModule.key2 | leftModule.key3 | leftModule.leftButton | leftModule.middleButton | leftModule.rightButton
KEYID_ABBREV = rightAlt | rightCtrl | rightFn | rightMod | rightShift | rightSpace | rightSuper | rightModule.leftButton | rightModule.rightButton
MACRONAME = <Case sensitive macro identifier as named in Agent. Identifier shall not contain spaces.(IDENTIFIER)>
`


export let testGrammar = `
BODY = //<comment>
BODY = [LABEL:] COMMAND [//<comment>]
COMMAND = [CONDITION|MODIFIER]* COMMAND
COMMAND = delayUnti
COMMAND = set keystrokeDelay <time in ms, at most 65535 (INT)>
CONDITION = {ifShift | ifAlt | ifCtrl | ifGui | ifAnyMod | ifNotShift | ifNotAlt | ifNotCtrl | ifNotGui | ifNotAnyMod}
`

let regexPattern: string = '/([^/]|\\/|\\\\)+/';
let nonterminalPattern: string = '[A-Z0-9_]+';
let identifierPattern: string = '[a-zA-Z0-9_]+';
let humanPattern: string = '<([^<>]*)\\((' + nonterminalPattern + ')\\)>';
let simpleHumanPattern: string = '<[^<>]+>'

let tokenPattern = [
'[a-zA-Z0-9_]+',
humanPattern,
regexPattern,
'//',
'[\\]][+?*]',
'[}][+?*]',
'<=',
'>=',
'==',
'!=',
'&&',
'[|][|]',
simpleHumanPattern,
'[^ ]',
].join('|')
let tokenizerPattern = '^ *(' + tokenPattern + ')'

function strict(pattern: string): string {
    return "^" + pattern + "$";
}

export let strictRegexRegex: RegExp = new RegExp(strict(regexPattern));
export let strictHumanRegex: RegExp = new RegExp(strict(humanPattern));
export let strictNonterminalRegex: RegExp = new RegExp(strict(nonterminalPattern));
export let strictIdentifierRegex: RegExp = new RegExp(strict(identifierPattern));
export let nonterminalRegex: RegExp = new RegExp(nonterminalPattern);
export let tokenizerRegex: RegExp = new RegExp(tokenizerPattern);
