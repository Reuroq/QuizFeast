/**
 * Smoke test for forms-db. Run: `node tests/forms_db_test.mjs`
 * Writes to ./data/ (gitignored) — safe to re-run.
 */
import {
  createForm, getForm, listForms, updateForm, deleteForm,
  createSubmission, listSubmissions, countSubmissions, deleteSubmission,
  validateSubmission,
} from '../src/lib/forms-db.js';

let passed = 0, failed = 0;
function ok(label, cond) {
  if (cond) { console.log('  ✓', label); passed++; }
  else { console.log('  ✗', label); failed++; }
}

console.log('forms-db smoke test');

// 1. Create
const f1 = createForm({
  title: 'Beta Signup Test',
  description: 'Get on the list.',
  schema: [
    { id: 'email', type: 'email', label: 'Email', required: true },
    { id: 'name', type: 'text', label: 'Name', required: false },
    { id: 'interest', type: 'select', label: 'Interest', options: ['CBT', 'Flashcards', 'Extension'], required: true },
  ],
  settings: { success_message: 'You are on the list.' },
});
ok('createForm returns form with id', !!f1?.id);
ok('createForm slugifies title', f1.slug.startsWith('beta-signup-test'));

// 2. List
const all = listForms();
ok('listForms includes new form', all.some(f => f.id === f1.id));

// 3. Read by slug
ok('getForm by slug', getForm(f1.slug)?.id === f1.id);
ok('getForm by id', getForm(f1.id)?.id === f1.id);

// 4. Update
const upd = updateForm(f1.id, { description: 'Updated.' });
ok('updateForm changes description', upd.description === 'Updated.');

// 5. Validation
const errs1 = validateSubmission(f1, { email: 'not-an-email' });
ok('validateSubmission flags bad email', !!errs1.email);
const errs2 = validateSubmission(f1, { email: 'a@b.com', interest: 'CBT' });
ok('validateSubmission accepts valid submission', Object.keys(errs2).length === 0);

// 6. Submit
const s1 = createSubmission(f1.id, { data: { email: 'a@b.com', name: 'Alice', interest: 'CBT' }, ip: '1.2.3.4', userAgent: 'test' });
const s2 = createSubmission(f1.id, { data: { email: 'b@c.com', name: 'Bob', interest: 'Flashcards' }, ip: '1.2.3.4', userAgent: 'test' });
ok('createSubmission returns id', !!s1.id && !!s2.id);
ok('countSubmissions = 2', countSubmissions(f1.id) === 2);

// 7. List submissions newest-first
const subs = listSubmissions(f1.id);
ok('listSubmissions ordered newest-first', subs[0].id === s2.id);

// 8. Delete one
deleteSubmission(s1.id);
ok('deleteSubmission decrements count', countSubmissions(f1.id) === 1);

// 9. Delete form
deleteForm(f1.id);
ok('deleteForm removes from list', !getForm(f1.id));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
