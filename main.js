const demoOriginalText = `
DEMO - Original text with grammar mistakes

I has a small shop in the city.
Every morning, I opens the door at nine.
My customers is usually very kind.
Yesterday, a woman buyed two books and say thank you.
I want to make my English more better.
`;

const demoCorrectedText = `
DEMO - Corrected text

I have a small shop in the city.
Every morning, I open the door at nine.
My customers are usually very kind.
Yesterday, a woman bought two books and said thank you.
I want to make my English better.
`;

const baseUrl = "https://static.parastorage.com/unpkg/monaco-editor@0.55.1/min/vs";
const defaultLanguage = "plaintext";

const loader = Object.assign(document.createElement("script"), {
  async: true,
  src: `${baseUrl}/loader.js`,
  onload() {
    require.config({
      paths: {
        vs: baseUrl
      }
    });

    require(["vs/editor/editor.main"], () => {
      const originalModel = monaco.editor.createModel(demoOriginalText, defaultLanguage);
      const modifiedModel = monaco.editor.createModel(demoCorrectedText, defaultLanguage);
      const diffEditor = monaco.editor.createDiffEditor(document.getElementById("editor"), {
        theme: "vs-dark",
        renderWhitespace: "all",
        fontSize: 16,
        useShadowDOM: true,
        readOnly: false,
        originalEditable: true,
        automaticLayout: true
      });

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
      });

      setupLanguageSelect({
        select: document.getElementById("languageSelect"),
        status: document.getElementById("languageStatus"),
        models: [originalModel, modifiedModel]
      });

      revealEditorWhenReady(diffEditor);
    });
  }
});

document.head.append(loader);

async function revealEditorWhenReady(diffEditor) {
  await nextFrame();
  await nextFrame();
  diffEditor.layout();
  document.body.classList.remove("is-loading-editor");
  document.getElementById("editorLoader")?.setAttribute("hidden", "");
}

function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

function setupLanguageSelect({ select, status, models }) {
  const languages = monaco.languages
    .getLanguages()
    .map((language) => ({
      id: language.id,
      label: getLanguageLabel(language)
    }))
    .sort((first, second) => {
      if (first.id === defaultLanguage) {
        return -1;
      }

      if (second.id === defaultLanguage) {
        return 1;
      }

      return first.label.localeCompare(second.label);
    });

  const options = document.createDocumentFragment();

  const list = languages.map((language) =>
    Object.assign(document.createElement("option"), {
      value: language.id,
      textContent: language.label
    }),
  );

  options.append(...list);
  select.replaceChildren(options);
  select.value = defaultLanguage;
  select.disabled = false;

  select.addEventListener("change", async () => {
    const langId = select.value;

    setLanguageLoading({ select, status, isLoading: true });
    try {
      await loadLanguageSupport(langId);
    } finally {
      models.forEach((model) => monaco.editor.setModelLanguage(model, langId));
      setLanguageLoading({ select, status, isLoading: false });
      select.focus();
    }
  });
}

function setLanguageLoading({ select, status, isLoading }) {
  select.disabled = isLoading;
  select.setAttribute("aria-busy", String(isLoading));
  status.hidden = !isLoading;
}

function getLanguageLabel(language) {
  const alias = language.aliases?.[0];
  return alias ? `${alias} (${language.id})` : language.id;
}

async function loadLanguageSupport(langId) {
  await monaco.languages.getLanguages().find((i) => i.id === langId)?.loader?.();
}
