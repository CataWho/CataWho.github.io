// Todos los textos del juego, en castellano e inglés: [español, inglés].
// Para cambiar la historia, alcanza con editar este archivo.

import { lang } from "../../core/i18n.js";

const TEXTS = {
  // --- Título y prólogo ---------------------------------------------------------------------------
  title: ["ESTELA", "ESTELA"],
  subtitle: ["BUSCADORA DE MUNDOS", "WORLD SEEKER"],
  pressStart: ["PRESIONÁ ENTER", "PRESS ENTER"],
  tapStart: ["TOCÁ START", "TAP START"],
  prologue: [
    [
      "AÑO 2311. LA TIERRA ESTÁ CANSADA: EL AIRE PESA Y LOS MARES SUBEN.",
      "ESTELA, EXPLORADORA DE LA TIERRA, PARTE A BUSCAR UN PLANETA DONDE LA HUMANIDAD PUEDA VOLVER A EMPEZAR.",
      "PERO ANTES DE DESPEGAR, ALGO VERDE SE METIÓ EN LA NAVE NODRIZA...",
    ],
    [
      "YEAR 2311. EARTH IS TIRED: THE AIR IS HEAVY AND THE SEAS ARE RISING.",
      "ESTELA, AN EXPLORER FROM EARTH, SETS OUT TO FIND A PLANET WHERE HUMANITY CAN START OVER.",
      "BUT BEFORE TAKEOFF, SOMETHING GREEN GOT INTO THE MOTHERSHIP...",
    ],
  ],
  skip: ["START: SALTEAR", "START: SKIP"],

  // --- Nivel 1: la nave nodriza ------------------------------------------------------------------------
  level1: ["NIVEL 1", "LEVEL 1"],
  level1Name: ["LA NAVE NODRIZA", "THE MOTHERSHIP"],
  level1Goal: ["LLEGÁ AL HANGAR", "REACH THE HANGAR"],
  go: ["¡SEGUÍ!", "GO!"],
  hangar: ["HANGAR", "HANGAR"],

  // --- Viaje -------------------------------------------------------------------------------------------
  voyage: [
    [
      "REGISTRO DE VUELO DE ESTELA. DÍA 1.",
      "LA NAVE NODRIZA QUEDA ATRÁS. LA TIERRA TAMBIÉN.",
      "SALTO AL HIPERESPACIO...",
      "SISTEMA KEPLER-442: UN PLANETA ROJO CON TRES LUNAS.",
      "LOS SENSORES DETECTAN AGUA. Y ALGO QUE SE MUEVE.",
    ],
    [
      "ESTELA'S FLIGHT LOG. DAY 1.",
      "THE MOTHERSHIP FALLS BEHIND. SO DOES EARTH.",
      "JUMPING TO HYPERSPACE...",
      "KEPLER-442 SYSTEM: A RED PLANET WITH THREE MOONS.",
      "SENSORS DETECT WATER. AND SOMETHING MOVING.",
    ],
  ],

  // --- Nivel 2: el planeta Carmín ---------------------------------------------------------------------------
  level2: ["NIVEL 2", "LEVEL 2"],
  level2Name: ["PLANETA CARMÍN", "CRIMSON PLANET"],
  round: ["RONDA {n}", "ROUND {n}"],
  fight: ["¡A PELEAR!", "FIGHT!"],
  ko: ["K.O.", "K.O."],
  time: ["¡TIEMPO!", "TIME!"],
  youWin: ["¡GANASTE!", "YOU WIN!"],
  tryAgain: ["OTRA VEZ", "TRY AGAIN"],
  leaper: ["SALTARINA", "LEAPER"],
  brute: ["BRUTO", "BRUTE"],

  // --- Segundo viaje: del planeta Carmín al planeta Ámbar -------------------------------------------------
  voyage2: [
    [
      "REGISTRO DE VUELO DE ESTELA. DÍA 12.",
      "EL PLANETA CARMÍN TIENE AGUA, PERO YA TIENE DUEÑOS. HAY QUE SEGUIR BUSCANDO.",
      "SALTO AL HIPERESPACIO...",
      "NEBULOSA ESMERALDA: UN PLANETA DORADO CON ANILLOS DE HIELO.",
      "AIRE TIBIO, OXÍGENO... Y UNA SEÑAL VERDE MUY, MUY GRANDE.",
    ],
    [
      "ESTELA'S FLIGHT LOG. DAY 12.",
      "THE CRIMSON PLANET HAS WATER, BUT IT ALREADY HAS OWNERS. THE SEARCH GOES ON.",
      "JUMPING TO HYPERSPACE...",
      "EMERALD NEBULA: A GOLDEN PLANET WITH ICE RINGS.",
      "WARM AIR, OXYGEN... AND A VERY, VERY BIG GREEN SIGNAL.",
    ],
  ],

  // --- Nivel 3: el planeta Ámbar ------------------------------------------------------------------------
  level3: ["NIVEL 3", "LEVEL 3"],
  level3Name: ["PLANETA ÁMBAR", "AMBER PLANET"],
  queen: ["BABOSA REINA", "SLUG QUEEN"],
  worm: ["GUSANO VOLTIO", "VOLT WORM"],
  notYet: ["¡TODAVÍA NO!", "NOT YET!"],
  splat: ["¡BUAH!", "SPLAT!"],
  grabIt: ["¡AGARRALO!", "GRAB IT!"],
  fullHp: ["¡VIDA LLENA!", "FULL HEALTH!"],

  // --- Continuar, game over, final ------------------------------------------------------------------------------
  continue: ["¿CONTINUAR?", "CONTINUE?"],
  continueHint: ["ENTER O GOLPE", "ENTER OR PUNCH"],
  gameOver: ["GAME OVER", "GAME OVER"],
  ending: [
    [
      "PLANETA ÁMBAR: SE PUEDE RESPIRAR... PERO ESTÁ LLENO DE HUEVOS.",
      "ESTELA ANOTA TODO EN SU REGISTRO Y VUELVE A DESPEGAR.",
      "EL UNIVERSO ES GRANDE. LA BÚSQUEDA SIGUE.",
    ],
    [
      "AMBER PLANET: THE AIR IS BREATHABLE... BUT IT IS FULL OF EGGS.",
      "ESTELA WRITES IT ALL DOWN IN HER LOG AND TAKES OFF AGAIN.",
      "THE UNIVERSE IS BIG. THE SEARCH GOES ON.",
    ],
  ],
  toBeContinued: ["CONTINUARÁ...", "TO BE CONTINUED..."],
  score: ["PUNTOS", "SCORE"],

  // --- Pausa (la usa el motor) -----------------------------------------------------------------------
  paused: ["PAUSA", "PAUSED"],
  resume: ["ENTER PARA SEGUIR", "ENTER TO RESUME"],
  resumeTouch: ["TOCÁ START PARA SEGUIR", "TAP START TO RESUME"],
  // Controles (se ven en la pausa). Cada renglón entra en la pantalla: máximo 38 letras.
  helpKeys: [
    [
      "A D  CAMINAR   W  SALTAR   S  AGACHARSE",
      "J  GOLPE   K  PATADA   L  ONDA ESTELAR",
      "W + L  CORTE LUNAR   ESPACIO  DEFENSA",
      "EN EL AIRE SE PUEDE CORREGIR EL SALTO",
      "(TAMBIÉN SIRVEN LAS FLECHAS)",
    ],
    [
      "A D  WALK   W  JUMP   S  CROUCH",
      "J  PUNCH   K  KICK   L  STAR WAVE",
      "W + L  MOON SLASH   SPACE  BLOCK",
      "YOU CAN STEER WHILE JUMPING",
      "(ARROW KEYS WORK TOO)",
    ],
  ],
  helpTouch: [
    [
      "CRUCETA: MOVERSE, SALTAR, AGACHARSE",
      "PODER: ONDA ESTELAR",
      "ARRIBA + PODER: CORTE LUNAR",
      "DEFENSA: CUBRIRSE CON EL SABLE",
    ],
    [
      "D-PAD: MOVE, JUMP, CROUCH",
      "POWER: STAR WAVE",
      "UP + POWER: MOON SLASH",
      "BLOCK: GUARD WITH THE SABER",
    ],
  ],
  controlsHint: ["ENTER: PAUSA Y CONTROLES", "ENTER: PAUSE AND CONTROLS"],
  controlsHintTouch: ["START: PAUSA Y CONTROLES", "START: PAUSE AND CONTROLS"],
};

/** Texto en el idioma de la página. say("round", { n: 2 }) → "RONDA 2". */
export function say(key, vars) {
  const text = TEXTS[key][lang === "en" ? 1 : 0];
  return vars ? text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "") : text;
}
