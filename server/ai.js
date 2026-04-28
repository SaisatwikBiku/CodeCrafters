// ── Shared Gemini helper ──────────────────────────────────────────────────────

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Call the Gemini REST API.
 * @param {string} systemText   - system instruction text
 * @param {string} userText     - user turn text
 * @param {object} opts         - { json: bool, temperature, maxTokens }
 * Returns the raw text of the first candidate, or null on any failure.
 */
async function callGemini(systemText, userText, { json = false, temperature = 0.9, maxTokens = 512 } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const body = {
    system_instruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Gemini] HTTP ${res.status}:`, errText.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!text) console.warn('[Gemini] Empty response:', JSON.stringify(data).slice(0, 300));
    return text;
  } catch (err) {
    console.warn('[Gemini] fetch error:', err.message);
    return null;
  }
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

const CHAT_FALLBACKS = [
  "Think about what value you need to store first — try assigning it to a variable!",
  "Check your task steps again — they'll point you in the right direction.",
  "Try running your code and see what the output looks like so far.",
  "Remember: print() shows output. What do you want to print?",
  "You're close! Read the task description again carefully.",
  "Think about what Python construct matches the step you're on.",
  "Don't worry — just try something and run it. Errors help you learn!",
];

export async function generateAIChatResponse(userMessage, stage, task = null) {
  const taskContext = task
    ? `\n\nThe student is working on this task:\nTitle: ${task.title}\nDescription: ${task.description}\nSteps: ${task.steps.join(' | ')}\n${task.expected_output ? `Expected output: "${task.expected_output}"` : ''}`
    : '';

  const systemText = `You are "AI Buddy", a helpful Python coding assistant in CodeCrafters, a learning game for beginners (ages 14-18).
You're helping a student on stage ${stage}/5.${taskContext}

When the student asks for help, give clear hints and guidance tailored to their specific task.
You may share short code snippets (1-3 lines) to illustrate a concept or syntax — but do NOT give away the complete solution.
Be friendly, encouraging, and concise (2-4 sentences max).`;

  const text = await callGemini(systemText, userMessage, { temperature: 0.9, maxTokens: 300 });
  if (text) return text.trim();

  // Anthropic fallback
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemText,
        messages: [{ role: 'user', content: userMessage }],
      });
      return response.content[0].text;
    }
  } catch { /* fall through */ }

  return CHAT_FALLBACKS[Math.floor(Math.random() * CHAT_FALLBACKS.length)];
}

// ── Task generation ───────────────────────────────────────────────────────────

// Detailed per-level spec sent verbatim to Gemini so it cannot drift out of scope.
const LEVEL_SPEC = {
  1: {
    name: 'Foundation',
    summary: 'variables, data types, print()',
    allowed: `ALLOWED constructs (Foundation):
- Variable assignment: name = value
- Data types: str, int, float, bool
- print() with plain string concatenation using + and str() only
- input() only when the task explicitly needs user input (set expected_output to null in that case)
FORBIDDEN: if/else, loops, functions, lists, imports, f-strings (NO f"..." syntax anywhere — not in starterCode, not in solutions)
Use string concatenation: print("Value: " + str(x))  — NEVER print(f"Value: {x}")`,
    architectExample: `# Architect (Library · Foundation):
lib_name = "Grand Library"
is_open = True
print(lib_name + " open: " + str(is_open))
# expected_output: "Grand Library open: True"
# Note: plain string concatenation with +, NOT f-strings.`,
    builderExample: `# Builder (Library · Foundation):
# Variables from your Architect:
book_count = 500

# Your task begins here:
new_books = 50
total = book_count + new_books
print("Total books: " + str(total))
# expected_output: "Total books: 550"
# Note: plain string concatenation with +, NOT f-strings.`,
  },
  2: {
    name: 'Walls',
    summary: 'if/else conditionals, for loops, lists',
    allowed: `ALLOWED constructs (Walls):
- if / elif / else statements
- for loops iterating over a list or range()
- List literals: items = [...]
- print() inside or outside control flow
- len() is allowed
- Variables and data types from Foundation
FORBIDDEN: while loops, functions (def), imports, try/except, nested functions`,
    architectExample: `# Architect (Cafeteria · Walls):
meals = 80
if meals > 50:
    print("Busy day!")
else:
    print("Quiet day")
# expected_output: "Busy day!"
# Architect sets the threshold and writes the conditional decision.`,
    builderExample: `# Builder (Gym · Walls):
# Variables from your Architect:
teams = ["Tigers", "Hawks", "Wolves"]

# Your task begins here:
for t in teams:
    print(t)
# expected_output: "Tigers\\nHawks\\nWolves"
# Builder receives the pre-set list, loops through it to process each item.`,
  },
  3: {
    name: 'Roof',
    summary: 'functions with parameters and return values',
    allowed: `ALLOWED constructs (Roof):
- def function_name(param1, param2, ...): with a return statement
- Calling the function and printing its return value
- Simple arithmetic or string operations inside the function
- if/else and lists inside the function body if needed
- Variables and data types from Foundation
FORBIDDEN: classes, imports, recursion, lambda, global variables modified inside function`,
    architectExample: `# Architect (Cafeteria · Roof):
def greet(name):
    return "Hey " + name + ", lunch is ready!"
print(greet("Alex"))
# expected_output: "Hey Alex, lunch is ready!"
# Architect defines the function concept and calls it with a literal argument.`,
    builderExample: `# Builder (Gym · Roof):
# Variables from your Architect:
score = 60

# Your task begins here:
def winner(score):
    if score > 50:
        return "Win"
    return "Loss"
print(winner(score))
# expected_output: "Win"
# Builder receives a pre-set variable, defines the function, and calls it with that variable.`,
  },
};

/**
 * Generate a fresh Task for the given context via Gemini.
 * Returns a Task-shaped object, or null if generation fails.
 *
 * Task shape:
 *   { title, description, steps: string[], starterCode, expected_output: string|null }
 */
export async function generateTask({ building, stage, level, role }) {
  const spec = LEVEL_SPEC[level] ?? LEVEL_SPEC[1];

  const isBuilder = role === 'Builder';

  const roleContext = isBuilder
    ? `The Builder's job is to USE variables the Architect already set up — implementing loops, conditionals, or functions with that data. Both roles learn the same Python concept, but from different angles: the Architect designs/names the data, the Builder processes/implements with it.`
    : `The Architect's job is to DESIGN and DECLARE — naming variables, setting values, creating lists, writing conditions that define the rules of the building.`;

  const starterCodeRule = isBuilder
    ? `starterCode for Builder MUST follow this exact format:
  Line 1: "# Variables from your Architect:"
  Line 2+: pre-initialized variables the Builder will use (do NOT ask them to re-declare these)
  Then a blank line, then: "# Your task begins here:"
  This makes it clear to the Builder that these variables already exist.
  For Foundation level, include 1–2 pre-set variables AND leave room for the Builder to declare 1 new variable of their own.
  For Walls level, pre-set the list or comparison value the Builder will loop/branch over.
  For Roof level, pre-set the argument variable the Builder will pass into their function.`
    : `starterCode for Architect: 1–2 lines max — a helpful comment or a partial first line showing where to start. No solution code.`;

  const exampleSolution = isBuilder ? spec.builderExample : spec.architectExample;

  const systemText = `You are a Python question generator for CodeCrafters, a coding game for high school students (ages 14–18).
You produce exactly one Python coding task per request. Tasks must feel fun, quick, and totally achievable in under 3 minutes.

CRITICAL RULES — violating any of these means the task is wrong:
1. The task MUST use the ${spec.name} level constructs only.
${spec.allowed}
2. The solution must be fully runnable with standard Python 3, zero imports.
3. Theme: every variable name, value, and scenario must relate to the ${building} on a school campus in a fun, realistic way (think: scores, team names, locker numbers, lunch orders, game results — things high schoolers actually care about).
4. Vary the task each call — different variable names, numbers, and scenarios every time.
5. Variable names must be SHORT and simple (e.g. score, name, count, team — NOT compound_names_like_this).
6. expected_output must be the EXACT stdout string the correct solution prints, using real \\n for multiple lines.
   Only set expected_output to null when the task genuinely requires input().
7. ${starterCodeRule}
8. steps: EXACTLY 2 or 3 short, friendly steps. No more. Guide without revealing the answer.
   For Builder steps: begin the first step with "Your Architect set [variable] for you." so the student understands the context.
   For Architect steps: begin with creating/declaring the needed variables or structures.
9. Return ONLY a JSON object — no markdown fences, no prose outside the JSON.

ROLE DIFFERENTIATION:
Both roles learn the same Python concept at each level. The difference is perspective:
- Architect = designer: declares variables, creates lists, sets thresholds and names
- Builder = implementer: receives pre-set data, writes the logic/computation/function that processes it

Example for this role (do NOT copy — create a fresh variation):
${exampleSolution}`;

  const userText = `Generate a fun, simple ${spec.name} level Python task for a high schooler:
- Building: ${building} (stage ${stage}/5)
- Role: ${role} — ${roleContext}
- Allowed Python: ${spec.summary}

Keep it short and fun. Use simple variable names. Make it feel relevant to real high school life at this building.

Return JSON with exactly these keys:
{
  "title": "<Building> · ${spec.name} — <Short Fun Task Name>",
  "description": "<one fun sentence that sets the scene>",
  "steps": ["<step 1>", "<step 2>"],
  "starterCode": "<starter code following the role rules above>",
  "expected_output": "<exact stdout or null>"
}`;

  const raw = await callGemini(systemText, userText, { json: true, temperature: 1.0, maxTokens: 2048 });
  if (!raw) return null;

  try {
    const task = JSON.parse(raw);

    if (
      typeof task.title !== 'string' ||
      typeof task.description !== 'string' ||
      !Array.isArray(task.steps) ||
      typeof task.starterCode !== 'string'
    ) {
      console.warn('[Gemini] Malformed task:', JSON.stringify(task).slice(0, 300));
      return null;
    }

    return {
      title:           task.title,
      description:     task.description,
      steps:           task.steps,
      starterCode:     task.starterCode,
      expected_output: task.expected_output ?? null,
    };
  } catch (err) {
    console.warn('[Gemini] JSON parse error:', err.message, '| raw:', raw.slice(0, 300));
    return null;
  }
}
