const API_URL = "http://localhost:3074";

const SESSION_ID = "bd0d8ed1-e031-454a-83bf-dfdc59ff10de";
const QUESTION_ID = "886be6e4-b23d-416b-8ad8-c5bb37630ef9";

const sourceCode = document.getElementById("sourceCode");
const language = document.getElementById("language");
const runButton = document.getElementById("runButton");
const submitButton = document.getElementById("submitButton");
const resultsContainer = document.getElementById("results");
const executionStatus = document.getElementById("executionStatus");
const finalScore = document.getElementById("finalScore");

function createRqUID() {
  return crypto.randomUUID();
}

function setLoading(loading, message = "Executing...") {
  runButton.disabled = loading;
  submitButton.disabled = loading;

  executionStatus.textContent = loading ? message : "Ready";
}

function renderResults(results) {
  resultsContainer.innerHTML = "";

  if (!results || results.length === 0) {
    resultsContainer.innerHTML =
      '<p class="empty-results">No test case results available.</p>';
    return;
  }

  results.forEach((result, index) => {
    const item = document.createElement("div");
    item.className = "result-item";

    const name =
      result.visibility === "HIDDEN"
        ? `Hidden Test ${index + 1}`
        : `Public Test ${index + 1}`;

    const output =
      result.actualOutput !== null && result.actualOutput !== undefined
        ? `<div class="result-output">Output: ${escapeHtml(
            result.actualOutput,
          )}</div>`
        : "";

    item.innerHTML = `
			<div class="result-left">
				<span class="result-badge">
					${result.visibility || "PUBLIC"}
				</span>

				<div>
					<strong>${name}</strong>
					${output}
				</div>
			</div>

			<span class="result-status ${result.status}">
				${result.status}
			</span>
		`;

    resultsContainer.appendChild(item);
  });
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-RqUID": createRqUID(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.Status?.ServerStatusDesc || "An unexpected error occurred",
    );
  }

  return data;
}

runButton.addEventListener("click", async () => {
  try {
    setLoading(true, "Running code...");
    finalScore.textContent = "";

    const response = await request(
      `/assessment-sessions/${SESSION_ID}/questions/${QUESTION_ID}/run`,
      {
        method: "POST",
        body: JSON.stringify({
          programmingLanguageId: language.value,
          sourceCode: sourceCode.value,
        }),
      },
    );

    if (response.Data.status === "COMPILE_ERROR") {
      resultsContainer.innerHTML = `
				<div class="result-status ERROR">
					Compilation Error
				</div>
				<pre>${escapeHtml(response.Data.compileError || "")}</pre>
			`;

      return;
    }

    renderResults(
      response.Data.results.map((result) => ({
        ...result,
        visibility: "PUBLIC",
      })),
    );
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
});

submitButton.addEventListener("click", async () => {
  try {
    setLoading(true, "Submitting solution...");
    finalScore.textContent = "";

    const submissionResponse = await request(
      `/assessment-sessions/${SESSION_ID}/questions/${QUESTION_ID}/submissions`,
      {
        method: "POST",
        body: JSON.stringify({
          programmingLanguageId: language.value,
          sourceCode: sourceCode.value,
        }),
      },
    );

    const submissionId = submissionResponse.Data.id;

    const resultResponse = await request(
      `/submissions/${submissionId}/results`,
    );

    const result = resultResponse.Data;

    finalScore.textContent =
      result.score !== null ? `Score: ${result.score} / 10` : result.status;

    renderResults(result.results);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
});

function showError(message) {
  resultsContainer.innerHTML = `
		<div class="result-status ERROR">
			${escapeHtml(message)}
		</div>
	`;
}
