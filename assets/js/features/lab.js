// Laboratorio p5.js: las tarjetas de laboratorio.html y el proyecto destacado del inicio.

import { esc, node, q, qa } from "../core/dom.js";
import { deleteProject, saveProject } from "../core/db.js";
import { state } from "../core/state.js";
import { bindDialog, openDialog } from "../core/ui.js";
import { saveHomeLayout } from "./home-layout.js";
import { mountSketch } from "./sketch.js";

const SAVE_DELAY = 1500; // ms sin escribir antes de guardar el código
const RUN_DELAY = 600; // ms sin escribir antes de volver a correr el sketch

const STARTER_CODE = `function setup() {
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
  mountSketch(frame, project.code);
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
  return node(`
    <article class="project-card" data-project-card="${id}">
      <header>
        <div class="project-title-label">
          <span class="project-title-text">${esc(project.title)}</span>
          <input class="project-title-input" value="${esc(project.title)}" maxlength="100" readonly aria-label="Título del proyecto">
        </div>
        <button class="icon-button" data-edit-only data-edit-title title="Editar título" aria-label="Editar título">✎</button>
      </header>
      <p class="eyebrow">p5.js · público</p>
      <div class="project-description-wrap">
        <p class="project-description-text">${esc(project.description || "Sin descripción todavía.")}</p>
        <button class="icon-button" data-edit-only data-edit-description title="Editar descripción" aria-label="Editar descripción">✎</button>
        <textarea class="project-description-input" maxlength="300" readonly aria-label="Descripción del proyecto">${esc(project.description || "")}</textarea>
      </div>
      <div class="project-canvas">
        <iframe class="project-frame" data-project-frame title="Canvas de ${esc(project.title)}"></iframe>
      </div>
      <p class="canvas-note" data-project-note>Preparando canvas…</p>
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
  let saveTimer;
  let runTimer;

  const run = () => {
    note.textContent = "Preparando canvas…";
    note.classList.remove("has-error");
    mountSketch(frame, project.code, {
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
  frame.style.aspectRatio = `${project.canvas_width || 600} / ${project.canvas_height || 400}`;
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

export function setupProjectDialog() {
  dialog = q('[data-modal="project"]');
  if (dialog) bindDialog(dialog, createProject);
}

export const openProjectDialog = () => openDialog(dialog);

async function createProject(fields) {
  const project = {
    id: crypto.randomUUID(),
    title: fields.title.value.trim(),
    description: fields.detail.value.trim(),
    code: STARTER_CODE,
  };
  await saveProject(project);
  state.archive.projects.unshift(project);
  renderLab();
  dialog.close("saved");
}
