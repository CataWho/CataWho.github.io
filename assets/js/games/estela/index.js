// ESTELA · buscadora de mundos — el juego principal de la sala de juegos.
//
// La historia es una lista de pantallas en orden (STORY). Para sumar un nivel nuevo:
//   1. crear su archivo en screens/ (copiando la forma de otro nivel),
//   2. agregarlo a SCREENS con un nombre,
//   3. ponerlo en STORY en el lugar que le toca.
// Para probar una pantalla directamente: juegos.html?pantalla=amber

import { createArcade } from "../arcade/engine.js";
import { EFFECTS } from "./audio.js";
import { touchScreen } from "./hud.js";
import { say } from "./texts.js";
import { amberPlanetLevel } from "./screens/amber-planet.js";
import { endingScreen } from "./screens/ending.js";
import { mothershipLevel } from "./screens/mothership.js";
import { redPlanetLevel } from "./screens/red-planet.js";
import { prologueScreen, titleScreen } from "./screens/title.js";
import { voyageToAmber, voyageToCrimson } from "./screens/voyage.js";

const SCREENS = {
  title: titleScreen, // título
  prologue: prologueScreen, // la historia de Estela
  ship: mothershipLevel, // nivel 1: la nave nodriza (monstruos verdes)
  voyage: voyageToCrimson, // viaje al planeta rojo
  planet: redPlanetLevel, // nivel 2: el planeta Carmín (monstruos violetas y rosas)
  voyage2: voyageToAmber, // viaje por la nebulosa esmeralda
  amber: amberPlanetLevel, // nivel 3: el planeta Ámbar (Babosa Reina y Gusano Voltio)
  ending: endingScreen, // continuará...
};

const STORY = ["title", "prologue", "ship", "voyage", "planet", "voyage2", "amber", "ending"];

/** Arranca el juego en la ventana del arcade (ver pages/games.js). */
export function startGame({ root, canvas, pad, first }) {
  return createArcade({
    root,
    canvas,
    pad,
    screens: SCREENS,
    story: STORY,
    first,
    effects: EFFECTS,
    labels: {
      paused: say("paused"),
      resume: say(touchScreen ? "resumeTouch" : "resume"),
      help: say(touchScreen ? "helpTouch" : "helpKeys"),
    },
    data: { score: 0 },
  });
}
