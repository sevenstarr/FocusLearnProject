/**
 * FocusLearn Security Rules Audit — "Dirty Dozen" Verification Cases
 * Run with Firebase Emulator Suite (`firebase emulators:exec`) when `@firebase/rules-unit-testing` is present.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  expected: 'PERMISSION_DENIED' | 'ALLOW';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_AUDIT_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Cross-user profile read (PII isolation)',
    operation: 'get',
    path: '/users/userA',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'User directory scraping',
    operation: 'list',
    path: '/users',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow field injection on UserProfile',
    operation: 'create',
    path: '/users/userB',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'userB', isAdmin: true },
  },
  {
    id: 4,
    name: 'Owner spoofing on Subject creation',
    operation: 'create',
    path: '/users/userA/subjects/sub1',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'userB', code: 'ES101', name: 'Algoritmos' },
  },
  {
    id: 5,
    name: 'Backdated client timestamp on PomodoroSession',
    operation: 'create',
    path: '/users/userA/sessions/s1',
    expected: 'PERMISSION_DENIED',
    payload: { ownerId: 'userA', createdAt: '1970-01-01T00:00:00Z' },
  },
  {
    id: 6,
    name: 'Mutating completed SemesterGoal (terminal state lock)',
    operation: 'update',
    path: '/users/userA/goals/goalDone',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'active', currentValue: 20 },
  },
  {
    id: 7,
    name: 'ID Poisoning on StudyNote',
    operation: 'create',
    path: '/users/userA/notes/bad$id!chars',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Oversized string DoW on StudyNote content (>20000 chars)',
    operation: 'create',
    path: '/users/userA/notes/bigNote',
    expected: 'PERMISSION_DENIED',
    payload: { contentLength: 20001 },
  },
  {
    id: 9,
    name: 'Unbounded tags array (>10 elements)',
    operation: 'create',
    path: '/users/userA/notes/manyTags',
    expected: 'PERMISSION_DENIED',
    payload: { tagsCount: 11 },
  },
  {
    id: 10,
    name: 'Community chat author impersonation',
    operation: 'create',
    path: '/communityMessages/m1',
    expected: 'PERMISSION_DENIED',
    payload: { authorId: 'userB', channel: 'geral', text: 'Spoofed' },
  },
  {
    id: 11,
    name: 'Unverified email write to communityMessages',
    operation: 'create',
    path: '/communityMessages/m2',
    expected: 'PERMISSION_DENIED',
    payload: { authorId: 'userC', channel: 'geral', text: 'Unverified' },
  },
  {
    id: 12,
    name: 'Verified community post and channel query',
    operation: 'create',
    path: '/communityMessages/m3',
    expected: 'ALLOW',
    payload: { authorId: 'userA', channel: 'geral', text: 'Olá turma!' },
  },
];
