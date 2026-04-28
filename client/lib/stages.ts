import { Stage } from "@/types";

// Each building has three levels of tasks:
//   Level 1 — Foundation: variables, data types, print(), input()
//   Level 2 — Walls:      conditionals, loops, lists
//   Level 3 — Roof:       functions with parameters and return values
//
// Architect tasks: player defines variables / structures from scratch.
// Builder tasks:   variables are PRE-INITIALIZED in starterCode (as if the
//                  Architect already set them up). The Builder only writes
//                  logic — never re-declares what's already there.
export const STAGES: Stage[] = [
  // ─── Stage 1 · Library ─────────────────────────────────────────────────
  {
    stageNumber: 1,
    building: "Library",
    levels: {
      1: {
        Architect: [
          {
            title: "Library · Foundation — Name It",
            description: "The library needs a name before construction can begin.",
            steps: [
              "Create a variable called `lib_name`.",
              'Assign it the string value: "Grand Library"',
              "Print the variable.",
            ],
            starterCode: "# Define your variable below\n\n",
            expected_output: "Grand Library",
          },
        ],
        Builder: [
          {
            title: "Library · Foundation — New Delivery",
            description: "The Architect named the library and stocked it — track the new book delivery.",
            steps: [
              "Your Architect set `book_count = 500` for you.",
              "Declare `new_books = 50` and compute `total = book_count + new_books`.",
              'Print: "Total books: " + str(total)',
            ],
            starterCode: "# Variables from your Architect:\nbook_count = 500\n\n# Your task begins here:\n",
            expected_output: "Total books: 550",
          },
        ],
      },
      2: {
        Architect: [
          {
            title: "Library · Walls — Stock Check",
            description: "Decide whether the library is well stocked.",
            steps: [
              "Create `books = 150`.",
              'If `books > 100` print "Well stocked!", else print "Need more books".',
            ],
            starterCode: "# Conditional stock check\nbooks = 150\n\n",
            expected_output: "Well stocked!",
          },
        ],
        Builder: [
          {
            title: "Library · Walls — List the Genres",
            description: "The Architect catalogued the genres — loop through them and print each one.",
            steps: [
              "Your Architect prepared the `genres` list for you.",
              "Loop through it and print each genre on its own line.",
            ],
            starterCode: '# Variables from your Architect:\ngenres = ["Fiction", "Science", "History"]\n\n# Your task begins here:\n',
            expected_output: "Fiction\nScience\nHistory",
          },
        ],
      },
      3: {
        Architect: [
          {
            title: "Library · Roof — Welcome Function",
            description: "Greet every reader who walks in.",
            steps: [
              "Define a function `greet_reader()`.",
              'Inside, print: "Welcome to the Library!"',
              "Call the function.",
            ],
            starterCode: "# Define and call a function\n\n",
            expected_output: "Welcome to the Library!",
          },
        ],
        Builder: [
          {
            title: "Library · Roof — Book Info Function",
            description: "The Architect named the book — write a function that prints its info.",
            steps: [
              "Your Architect set `title = \"Python 101\"` for you.",
              'Define `book_info(title)` that prints: "Book: " + title',
              "Call `book_info(title)`.",
            ],
            starterCode: '# Variables from your Architect:\ntitle = "Python 101"\n\n# Your task begins here:\n',
            expected_output: "Book: Python 101",
          },
        ],
      },
    },
  },

  // ─── Stage 2 · Classroom ───────────────────────────────────────────────
  {
    stageNumber: 2,
    building: "Classroom",
    levels: {
      1: {
        Architect: [
          {
            title: "Classroom · Foundation — Ask for Input",
            description: "The classroom needs to know who's teaching today.",
            steps: [
              'Use `input()` to ask: "Enter teacher name: "',
              "Store the result in `teacher`.",
              'Print: "Welcome, " + teacher',
            ],
            starterCode: "# Get input and greet the teacher\n\n",
            expected_output: null,
          },
        ],
        Builder: [
          {
            title: "Classroom · Foundation — Free Seats",
            description: "The Architect counted total seats — figure out how many are still free.",
            steps: [
              "Your Architect set `total_seats = 30` for you.",
              "Declare `occupied = 22` and compute `free = total_seats - occupied`.",
              'Print: "Free seats: " + str(free)',
            ],
            starterCode: "# Variables from your Architect:\ntotal_seats = 30\n\n# Your task begins here:\n",
            expected_output: "Free seats: 8",
          },
        ],
      },
      2: {
        Architect: [
          {
            title: "Classroom · Walls — Roll Call",
            description: "Greet every student in the class.",
            steps: [
              'Create `students = ["Alex", "Sam", "Jo"]`.',
              'Loop through the list and print: "Hi " + name',
            ],
            starterCode: "# Loop over the students\n\n",
            expected_output: "Hi Alex\nHi Sam\nHi Jo",
          },
        ],
        Builder: [
          {
            title: "Classroom · Walls — Pass or Retry",
            description: "The Architect recorded the score — check whether it's a pass.",
            steps: [
              "Your Architect set `score = 85` for you.",
              'If score >= 80, print "Great!", else print "Try again".',
            ],
            starterCode: "# Variables from your Architect:\nscore = 85\n\n# Your task begins here:\n",
            expected_output: "Great!",
          },
        ],
      },
      3: {
        Architect: [
          {
            title: "Classroom · Roof — Start Class",
            description: "Announce the class with a function.",
            steps: [
              'Define `start_class(teacher)` that prints: "Class by " + teacher',
              'Call it with the argument "Ms. Ada".',
            ],
            starterCode: "# Define and call start_class(teacher)\n\n",
            expected_output: "Class by Ms. Ada",
          },
        ],
        Builder: [
          {
            title: "Classroom · Roof — Grade Function",
            description: "The Architect logged the score — write a function that returns the grade.",
            steps: [
              "Your Architect set `score = 75` for you.",
              'Define `grade(score)` that returns "Pass" if score >= 60, else "Fail".',
              "Print `grade(score)`.",
            ],
            starterCode: "# Variables from your Architect:\nscore = 75\n\n# Your task begins here:\n",
            expected_output: "Pass",
          },
        ],
      },
    },
  },

  // ─── Stage 3 · Cafeteria ───────────────────────────────────────────────
  {
    stageNumber: 3,
    building: "Cafeteria",
    levels: {
      1: {
        Architect: [
          {
            title: "Cafeteria · Foundation — Meal Price",
            description: "Display today's meal price.",
            steps: [
              "Create `meal_price = 8`.",
              'Print: "Price: $" + str(meal_price)',
            ],
            starterCode: "# Print the meal price\n\n",
            expected_output: "Price: $8",
          },
        ],
        Builder: [
          {
            title: "Cafeteria · Foundation — Discounted Meal",
            description: "The Architect set the meal and its price — apply the student discount.",
            steps: [
              "Your Architect set `meal_name` and `meal_price` for you.",
              "Declare `discount = 2` and compute `final_price = meal_price - discount`.",
              'Print: "Today: " + meal_name + " for $" + str(final_price)',
            ],
            starterCode: '# Variables from your Architect:\nmeal_name = "Pasta"\nmeal_price = 8\n\n# Your task begins here:\n',
            expected_output: "Today: Pasta for $6",
          },
        ],
      },
      2: {
        Architect: [
          {
            title: "Cafeteria · Walls — Menu Check",
            description: "Only serve food if the cafeteria is open.",
            steps: [
              "Create a variable `is_open = True`.",
              'Write an if/else: if open, print "Cafeteria is serving!", else print "Closed."',
            ],
            starterCode: "# Conditional check\nis_open = True\n\n",
            expected_output: "Cafeteria is serving!",
          },
        ],
        Builder: [
          {
            title: "Cafeteria · Walls — Enough Trays?",
            description: "The Architect tracked trays and students — check if there's enough.",
            steps: [
              "Your Architect set `trays = 30` and `students = 25` for you.",
              'If trays >= students, print "Enough trays!", else print "Need more trays!"',
            ],
            starterCode: "# Variables from your Architect:\ntrays = 30\nstudents = 25\n\n# Your task begins here:\n",
            expected_output: "Enough trays!",
          },
        ],
      },
      3: {
        Architect: [
          {
            title: "Cafeteria · Roof — Price Total",
            description: "Add two item prices with a function.",
            steps: [
              "Define `price_total(a, b)` that returns a + b.",
              "Print `price_total(5, 3)`.",
            ],
            starterCode: "# Define price_total(a, b) and print the result\n\n",
            expected_output: "8",
          },
        ],
        Builder: [
          {
            title: "Cafeteria · Roof — Is It Open?",
            description: "The Architect set the lunch hour — write a function to check if we're serving.",
            steps: [
              "Your Architect set `hour = 12` for you.",
              "Define `is_open(hour)` that returns `hour >= 9 and hour <= 14`.",
              "Print `is_open(hour)`.",
            ],
            starterCode: "# Variables from your Architect:\nhour = 12\n\n# Your task begins here:\n",
            expected_output: "True",
          },
        ],
      },
    },
  },

  // ─── Stage 4 · Science Lab ─────────────────────────────────────────────
  {
    stageNumber: 4,
    building: "Science Lab",
    levels: {
      1: {
        Architect: [
          {
            title: "Science Lab · Foundation — Label a Chemical",
            description: "Every beaker needs a label.",
            steps: [
              'Create `chemical = "H2O"`.',
              "Print the variable.",
            ],
            starterCode: "# Name a chemical\n\n",
            expected_output: "H2O",
          },
        ],
        Builder: [
          {
            title: "Science Lab · Foundation — Working Beakers",
            description: "The Architect counted all beakers — subtract the broken ones for the lab report.",
            steps: [
              "Your Architect set `beakers = 12` for you.",
              "Declare `broken = 2` and compute `working = beakers - broken`.",
              'Print: "Working beakers: " + str(working)',
            ],
            starterCode: "# Variables from your Architect:\nbeakers = 12\n\n# Your task begins here:\n",
            expected_output: "Working beakers: 10",
          },
        ],
      },
      2: {
        Architect: [
          {
            title: "Science Lab · Walls — Experiment List",
            description: "Run through today's experiments.",
            steps: [
              'Create `experiments = ["Boil", "Freeze", "Mix"]`.',
              "Loop through the list and print each experiment on its own line.",
            ],
            starterCode: "# Loop the experiments\n\n",
            expected_output: "Boil\nFreeze\nMix",
          },
        ],
        Builder: [
          {
            title: "Science Lab · Walls — Temperature Check",
            description: "The Architect measured the temperature — decide if the lab is warm or cold.",
            steps: [
              "Your Architect set `temp = 75` for you.",
              'If temp > 50, print "Warm", else print "Cold".',
            ],
            starterCode: "# Variables from your Architect:\ntemp = 75\n\n# Your task begins here:\n",
            expected_output: "Warm",
          },
        ],
      },
      3: {
        Architect: [
          {
            title: "Science Lab · Roof — Ring the Bell",
            description: "Ring a bell function at the start of class.",
            steps: [
              "Define a function `ring_bell()`.",
              'Inside, print: "🔔 Class has started!"',
              "Call the function.",
            ],
            starterCode: "# Define and call a function\n\n",
            expected_output: "🔔 Class has started!",
          },
        ],
        Builder: [
          {
            title: "Science Lab · Roof — Greet a Student",
            description: "The Architect identified the student — write a function that greets them.",
            steps: [
              'Your Architect set `name = "Alex"` for you.',
              'Define `greet(name)` that prints: "Hello, " + name + "!"',
              "Call `greet(name)`.",
            ],
            starterCode: '# Variables from your Architect:\nname = "Alex"\n\n# Your task begins here:\n',
            expected_output: "Hello, Alex!",
          },
        ],
      },
    },
  },

  // ─── Stage 5 · Playground ──────────────────────────────────────────────
  {
    stageNumber: 5,
    building: "Playground",
    levels: {
      1: {
        Architect: [
          {
            title: "Playground · Foundation — Count the Slides",
            description: "How many slides are on the playground?",
            steps: [
              "Create `slide_count = 3`.",
              'Print: "Slides: " + str(slide_count)',
            ],
            starterCode: "# Count the slides\n\n",
            expected_output: "Slides: 3",
          },
        ],
        Builder: [
          {
            title: "Playground · Foundation — Usable Swings",
            description: "The Architect counted the swings — subtract the broken ones and report.",
            steps: [
              "Your Architect set `swing_count = 4` for you.",
              "Declare `broken = 1` and compute `usable = swing_count - broken`.",
              'Print: "Usable swings: " + str(usable)',
            ],
            starterCode: "# Variables from your Architect:\nswing_count = 4\n\n# Your task begins here:\n",
            expected_output: "Usable swings: 3",
          },
        ],
      },
      2: {
        Architect: [
          {
            title: "Playground · Walls — Equipment List",
            description: "List every piece of playground equipment.",
            steps: [
              'Create `equipment = ["Swings", "Slide", "Seesaw"]`.',
              "Loop through it and print each item.",
            ],
            starterCode: "# Create list and loop\n\n",
            expected_output: "Swings\nSlide\nSeesaw",
          },
        ],
        Builder: [
          {
            title: "Playground · Walls — Count Activities",
            description: "The Architect listed the activities — count how many there are.",
            steps: [
              "Your Architect prepared the `activities` list for you.",
              'Print: "Total activities: " + str(len(activities))',
            ],
            starterCode: '# Variables from your Architect:\nactivities = ["Football", "Basketball", "Tag"]\n\n# Your task begins here:\n',
            expected_output: "Total activities: 3",
          },
        ],
      },
      3: {
        Architect: [
          {
            title: "Playground · Roof — Equipment Counter",
            description: "Count items with a function.",
            steps: [
              "Define `count_equipment(items)` that returns `len(items)`.",
              'Print `count_equipment(["Swings", "Slide", "Seesaw"])`.',
            ],
            starterCode: "# Define count_equipment(items) and print the result\n\n",
            expected_output: "3",
          },
        ],
        Builder: [
          {
            title: "Playground · Roof — Double the Fun",
            description: "The Architect set the base number — write a function that doubles it.",
            steps: [
              "Your Architect set `n = 5` for you.",
              "Define `double_fun(n)` that returns `n * 2`.",
              "Print `double_fun(n)`.",
            ],
            starterCode: "# Variables from your Architect:\nn = 5\n\n# Your task begins here:\n",
            expected_output: "10",
          },
        ],
      },
    },
  },
];
