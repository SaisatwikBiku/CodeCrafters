import { Stage } from '@/types';

export const STAGES: Stage[] = [
  {
    stageNumber: 1,
    building: 'Library',
    tasks: {
      Architect: {
        title: 'Stage 1 — Library: Name It',
        description: 'The library needs a name before construction can begin.',
        steps: [
          'Create a variable called `lib_name`.',
          'Assign it the string value: "Grand Library"',
          'Print the variable.',
        ],
        starterCode: '# Define your variable below\n\n',
        expected_output: 'Grand Library',
      },
      Builder: {
        title: 'Stage 1 — Library: Count the Books',
        description: 'Every library needs books on the shelves.',
        steps: [
          'Create a variable called `book_count`.',
          'Assign it the integer value: 500',
          'Print the variable.',
        ],
        starterCode: '# Define your variable below\n\n',
        expected_output: '500',
      },
    },
  },
  {
    stageNumber: 2,
    building: 'Classroom',
    tasks: {
      Architect: {
        title: 'Stage 2 — Classroom: Ask for Input',
        description: "The classroom needs to know who's teaching today.",
        steps: [
          'Use `input()` to ask: "Enter teacher name: "',
          'Store the result in `teacher`.',
          'Print: "Welcome, " + teacher',
        ],
        starterCode: '# Get input and greet the teacher\n\n',
        expected_output: null,
      },
      Builder: {
        title: 'Stage 2 — Classroom: Count Students',
        description: 'How many students are joining today?',
        steps: [
          'Use `input()` to ask: "How many students? "',
          'Convert to int, store in `students`.',
          'Print: "Seats needed: " + str(students)',
        ],
        starterCode: '# Read student count\n\n',
        expected_output: null,
      },
    },
  },
  {
    stageNumber: 3,
    building: 'Cafeteria',
    tasks: {
      Architect: {
        title: 'Stage 3 — Cafeteria: Menu Check',
        description: 'Only serve food if the cafeteria is open.',
        steps: [
          'Create a variable `is_open = True`.',
          "Write an if/else: if open, print \"Cafeteria is serving!\", else print \"Closed.\"",
        ],
        starterCode: '# Conditional check\nis_open = True\n\n',
        expected_output: 'Cafeteria is serving!',
      },
      Builder: {
        title: 'Stage 3 — Cafeteria: Enough Food?',
        description: 'Check if there are enough food trays.',
        steps: [
          'Set `trays = 30`, `students = 25`.',
          'If trays >= students, print "Enough trays!", else print "Need more trays!"',
        ],
        starterCode: '# Check tray supply\ntrays = 30\nstudents = 25\n\n',
        expected_output: 'Enough trays!',
      },
    },
  },
  {
    stageNumber: 4,
    building: 'Science Lab',
    tasks: {
      Architect: {
        title: 'Stage 4 — Science Lab: Ring the Bell',
        description: 'Ring a bell function at the start of class.',
        steps: [
          'Define a function `ring_bell()`.',
          'Inside, print: "🔔 Class has started!"',
          'Call the function.',
        ],
        starterCode: '# Define and call a function\n\n',
        expected_output: '🔔 Class has started!',
      },
      Builder: {
        title: 'Stage 4 — Science Lab: Greet Students',
        description: 'Write a function that greets a student by name.',
        steps: [
          'Define `greet(name)` that prints: "Hello, " + name + "!"',
          'Call it with the argument "Alex".',
        ],
        starterCode: '# Define and call greet(name)\n\n',
        expected_output: 'Hello, Alex!',
      },
    },
  },
  {
    stageNumber: 5,
    building: 'Playground',
    tasks: {
      Architect: {
        title: 'Stage 5 — Playground: Build Equipment List',
        description: 'List all the playground equipment.',
        steps: [
          'Create a list `equipment = ["Swings", "Slide", "Seesaw"]`.',
          'Loop through it and print each item.',
        ],
        starterCode: '# Create list and loop\n\n',
        expected_output: 'Swings\nSlide\nSeesaw',
      },
      Builder: {
        title: 'Stage 5 — Playground: Count Activities',
        description: 'How many activities can kids do?',
        steps: [
          'Create `activities = ["Football", "Basketball", "Tag"]`.',
          'Print: "Total activities: " + str(len(activities))',
        ],
        starterCode: '# List and length\n\n',
        expected_output: 'Total activities: 3',
      },
    },
  },
];
