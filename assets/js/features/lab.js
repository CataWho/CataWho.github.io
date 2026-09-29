// Laboratorio: las tarjetas de laboratorio.html y el proyecto destacado del inicio.
// Cada proyecto está hecho en p5.js o en Hydra (columna "engine" de la tabla projects).

import { esc, node, q, qa } from "../core/dom.js";
import { deleteProject, saveProject } from "../core/db.js";
import { state } from "../core/state.js";
import { bindDialog, openDialog } from "../core/ui.js";
import { feedAudio } from "./audio-analyser.js";
import { saveHomeLayout } from "./home-layout.js";
import { mountSketch } from "./sketch.js";

const SAVE_DELAY = 1500; // ms sin escribir antes de guardar el código
const RUN_DELAY = 600; // ms sin escribir antes de volver a correr el sketch
const MIGRATION = "supabase/migrations/2026-09-29-project-engine.sql";

const ENGINE_NAMES = { p5: "p5.js", hydra: "Hydra" };
const engineOf = (project) => (project.engine === "hydra" ? "hydra" : "p5");

const P5_STARTER = `function setup() {
  createCanvas(600, 600);
}

function draw() {
  background("#3e1220");
  noStroke();
  fill("#bd5268");
  circle(mouseX, mouseY, 80);
  fill("#f3f2ef");
  for (let i = 0; i < 10; i++) circle(60 + i * 60, 300 + sin(frameCount * 0.04 + i) * 70, 18);
}
`;

const HYDRA_STARTER = `// Hydra — https://hydra.ojack.xyz
// a.fft (de 0 a 1) sigue la música del inicio; en el laboratorio se mueve solo.
osc(20, 0.05, 0.3)
  .color(0.9, 0.25, 0.4)
  .modulate(noise(3), () => a.fft[0] * 0.5)
  .kaleid(4)
  .out()
`;

const CODE_FENCE = /^\s*```/;

/**
 * Lo que se pega al crear un proyecto puede ser código o un link del editor de Hydra
 * (…hydra.ojack.xyz/?code=…). También saca las líneas ``` que aparecen al copiar desde un chat.
 */
function readCodeInput(value) {
  const text = String(value || "").trim();
  try {
    const url = new URL(text);
    const encoded = url.searchParams.get("code");
    // El editor de Hydra guarda el código como base64(encodeURIComponent(código)).
    if (url.hostname.endsWith("hydra.ojack.xyz") && encoded)
      return decodeURIComponent(atob(encoded.replace(/ /g, "+")));
  } catch {
    // No era un link: es código.
  }
  return text
    .split("\n")
    .filter((line) => !CODE_FENCE.test(line))
    .join("\n");
}

/** Link para abrir un código en el editor oficial de Hydra. */
const hydraEditorUrl = (code) =>
  `https://hydra.ojack.xyz/?code=${encodeURIComponent(btoa(encodeURIComponent(code)))}`;

const projects = () => state.archive.projects || [];
const featuredProject = () =>
  projects().find(
    (project) => String(project.id) === String(state.archive.profile.layout?.featured_project_id),
  ) || projects()[0];

// --- Inicio: proyecto destacado ----------------------------------------------

export function renderLabPreview() {
  const frame = q("[data-home-project-frame]");
  if (!frame) return;
  const project = featuredProject();
  if (!project) {
    frame.removeAttribute("srcdoc");
    q("[data-home-project-title]").textContent = "Todavía no hay proyecto";
    q("[data-home-project-description]").textContent = "Creá uno en el laboratorio creativo.";
    return;
  }
  mountSketch(frame, project.code, { engine: engineOf(project) });
  // Si el destacado es de Hydra, escucha la música de "escuchando" como el fondo.
  if (engineOf(project) === "hydra") feedAudio(frame);
  q("[data-home-project-title]").textContent = project.title;
  q("[data-home-project-description]").textContent =
    project.description || "Experimento hecho con código creativo.";
}

// --- Página del laboratorio --------------------------------------------------

export function renderLab() {
  const grid = q("[data-project-grid]");
  if (!grid) return;
  if (!projects().length) {
    grid.innerHTML =
      '<p class="empty-state">Todavía no hay proyectos. Tocá “nuevo proyecto” para empezar.</p>';
    return;
  }
  const featuredId = String(featuredProject()?.id);
  grid.replaceChildren(
    ...projects().map((project) => projectCard(project, String(project.id) === featuredId)),
  );
  projects().forEach(bindProjectCard);
}

function projectCard(project, isFeatured) {
  const id = esc(project.id);
  const engine = engineOf(project);
  const hydraLink =
    engine === "hydra"
      ? `<a class="add-link hydra-link" data-hydra-link href="${esc(hydraEditorUrl(project.code))}" target="_blank" rel="noreferrer">abrir en el editor de Hydra ↗</a>`
      : "";
  return node(`
    <article class="project-card" data-project-card="${id}">
      <header>
        <div class="project-title-label">
          <span class="project-title-text">${esc(project.title)}</span>
          <input class="project-title-input" value="${esc(project.title)}" maxlength="100" readonly aria-label="Título del proyecto">
        </div>
        <button class="icon-button" data-edit-only data-edit-title title="Editar título" aria-label="Editar título">✎</button>
      </header>
      <p class="eyebrow">${ENGINE_NAMES[engine]} · público</p>
      <div class="project-description-wrap">
        <p class="project-description-text">${esc(project.description || "Sin descripción todavía.")}</p>
        <button class="icon-button" data-edit-only data-edit-description title="Editar descripción" aria-label="Editar descripción">✎</button>
        <textarea class="project-description-input" maxlength="300" readonly aria-label="Descripción del proyecto">${esc(project.description || "")}</textarea>
      </div>
      <div class="project-canvas">
        <iframe class="project-frame" data-project-frame title="Canvas de ${esc(project.title)}"></iframe>
      </div>
      <p class="canvas-note" data-project-note>Preparando canvas…</p>
      ${hydraLink}
      <details data-edit-only>
        <summary>Editar código</summary>
        <textarea class="code-editor" data-project-code spellcheck="false">${esc(project.code)}</textarea>
      </details>
      <footer>
        <span data-project-state>guardado</span>
        <span data-edit-only>
          <button class="add-link" data-feature-project>${isFeatured ? "✓ en el inicio" : "mostrar en inicio"}</button>
          <button class="add-link" data-run-project>actualizar vista ↻</button>
          <button class="add-link delete-text" data-delete-project>eliminar</button>
        </span>
      </footer>
    </article>`);
}

function bindProjectCard(project) {
  const card = q(`[data-project-card="${CSS.escape(String(project.id))}"]`);
  const status = q("[data-project-state]", card);
  const frame = q("[data-project-frame]", card);
  const note = q("[data-project-note]", card);
  const hydraLink = q("[data-hydra-link]", card);
  const engine = engineOf(project);
  let saveTimer;
  let runTimer;

  const run = () => {
    note.classList.remove("has-error");
    note.textContent =
      engine === "hydra"
        ? "Hydra en vivo · acá a.fft se mueve solo; en el inicio sigue la música."
        : "Preparando canvas…";
    if (hydraLink) hydraLink.href = hydraEditorUrl(project.code);
    mountSketch(frame, project.code, {
      engine,
      onSize: ({ width, height }) => {
        frame.style.aspectRatio = `${width} / ${height}`;
        if (!note.classList.contains("has-error"))
          note.textContent = `Canvas: ${width} × ${height}px · completo y a escala.`;
      },
      onError: (message) => {
        note.textContent = `Error en el código: ${message}`;
        note.classList.add("has-error");
      },
    });
  };

  const save = async () => {
    status.textContent = "guardando…";
    try {
      await saveProject({
        id: project.id,
        title: project.title,
        description: project.description,
        code: project.code,
      });
      status.textContent = "guardado";
    } catch (error) {
      status.textContent = "no se pudo guardar";
      console.error(error);
    }
  };

  // Título y descripción se editan "en el lugar": el ✎ habilita el campo.
  inlineEdit(card, "title", (value) => {
    project.title = value || "Proyecto sin título";
    save();
    return project.title;
  });
  inlineEdit(card, "description", (value) => {
    project.description = value;
    save();
    return value || "Sin descripción todavía.";
  });

  q("[data-project-code]", card).addEventListener("input", (event) => {
    project.code = event.target.value;
    status.textContent = "cambios sin guardar";
    clearTimeout(saveTimer);
    clearTimeout(runTimer);
    saveTimer = setTimeout(save, SAVE_DELAY);
    runTimer = setTimeout(run, RUN_DELAY);
  });
  q("[data-run-project]", card).onclick = run;
  q("[data-feature-project]", card).onclick = () => setFeaturedProject(project.id);
  q("[data-delete-project]", card).onclick = () => removeProject(project);
  frame.style.aspectRatio =
    engine === "hydra" ? "16 / 9" : `${project.canvas_width || 600} / ${project.canvas_height || 400}`;
  run();
}

function inlineEdit(card, field, commit) {
  const input = q(`.project-${field}-input`, card);
  const text = q(`.project-${field}-text`, card);
  q(`[data-edit-${field}]`, card).onclick = () => {
    input.readOnly = false;
    text.hidden = true;
    input.focus();
    input.select();
  };
  input.onchange = () => {
    const shown = commit(input.value.trim());
    text.textContent = shown;
  };
  input.onblur = () => {
    input.readOnly = true;
    text.hidden = false;
  };
}

async function setFeaturedProject(projectId) {
  if (!(await saveHomeLayout({ ...state.archive.profile.layout, featured_project_id: projectId }))) return;
  qa("[data-project-card]").forEach((card) => {
    const isFeatured = card.dataset.projectCard === String(projectId);
    q("[data-feature-project]", card).textContent = isFeatured ? "✓ en el inicio" : "mostrar en inicio";
  });
}

async function removeProject(project) {
  if (!confirm(`¿Eliminar el proyecto “${project.title}”?`)) return;
  try {
    await deleteProject(project.id);
    state.archive.projects = projects().filter((item) => item.id !== project.id);
    if (String(state.archive.profile.layout?.featured_project_id) === String(project.id))
      await saveHomeLayout({
        ...state.archive.profile.layout,
        featured_project_id: projects()[0]?.id || null,
      });
    renderLab();
  } catch (error) {
    alert(`No se pudo eliminar: ${error.message}`);
  }
}

// --- Diálogo "nuevo proyecto" -------------------------------------------------

let dialog;
let updateHint = () => {};

export function setupProjectDialog() {
  dialog = q('[data-modal="project"]');
  if (!dialog) return;
  bindDialog(dialog, createProject);
  // La ayuda del campo de código cambia según el lenguaje elegido.
  const fields = q("form", dialog).elements;
  updateHint = () => {
    const isHydra = fields.engine.value === "hydra";
    fields.code.placeholder = isHydra
      ? "Pegá tu código de Hydra o el link del editor (hydra.ojack.xyz/?code=…). Si lo dejás vacío, arranca con un ejemplo."
      : "Pegá tu sketch de p5.js. Si lo dejás vacío, arranca con un ejemplo.";
  };
  fields.engine.addEventListener("change", updateHint);
}

export function openProjectDialog() {
  openDialog(dialog);
  updateHint();
}

async function createProject(fields) {
  const engine = fields.engine.value === "hydra" ? "hydra" : "p5";
  const project = {
    id: crypto.randomUUID(),
    title: fields.title.value.trim(),
    description: fields.detail.value.trim(),
    code: readCodeInput(fields.code.value) || (engine === "hydra" ? HYDRA_STARTER : P5_STARTER),
    // Solo mandamos "engine" en Hydra: así p5.js funciona aunque todavía no se haya corrido la migración.
    ...(engine === "hydra" && { engine }),
  };
  try {
    await saveProject(project);
  } catch (error) {
    if (/engine/i.test(error.message))
      throw new Error(`falta actualizar la base de datos. Corré ${MIGRATION} en Supabase → SQL Editor.`);
    throw error;
  }
  state.archive.projects.unshift(project);
  renderLab();
  dialog.close("saved");
}
