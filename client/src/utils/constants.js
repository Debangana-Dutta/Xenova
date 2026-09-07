// These arrays mirror the enums declared on the Mongoose schemas
// (server/models/Transaction.js and server/models/Activity.js). They were
// previously hardcoded a second time inside Finance.js and Activities.js, so a
// category added to the schema silently failed validation in the UI.
//
// Keeping one copy per side of the wire is the practical compromise for a
// non-monorepo setup: if you change a schema enum, change it here too.

export const TRANSACTION_CATEGORIES = [
  'Food',
  'Transport',
  'Books',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Other',
];

export const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

export const ACTIVITY_TYPES = [
  'Workshop',
  'Hackathon',
  'Certification',
  'Sports',
  'Volunteering',
  'Competition',
  'Other',
];

export const ACTIVITY_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
];

// Chart + badge colours, keyed by category. Drawn from the sage/amber palette
// in tailwind.config.js so charts stay on-brand instead of using Recharts
// defaults.
export const CATEGORY_COLORS = {
  Food: '#548a62',
  Transport: '#dc8d20',
  Books: '#74a780',
  Entertainment: '#e6a638',
  Shopping: '#9dc4a5',
  Health: '#c06f18',
  Education: '#3f6f4c',
  Other: '#a1a1aa',
};
