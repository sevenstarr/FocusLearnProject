# FocusLearn Security Specification (Phase 0)

## 1. Data Invariants
6. **Credit Ledger & Session Validation**: Credits exist only as server-written ledger entries. A reward requires an authenticated server-tracked focus run reaching its full duration; each account has at most one active run and earns at most 8 study credits in any rolling 24-hour window. Session completion, purchases, and equipment changes are atomic and scoped to the authenticated owner. Clients cannot directly write balances or rewards.
1. **PII Isolation**: User profile documents (`/users/{userId}`) contain PII (`email`, `registration`). Only the authenticated verified owner (`request.auth.uid == userId`) can read, create, or update their profile. Blanket listing of `/users` is strictly denied (`allow list: if false`).
2. **Ownership & Master Gate**: Every user subcollection (`/subjects`, `/tasks`, `/sessions`, `/schedule`, `/notes`, `/goals`) is owned exclusively by `userId`. All creates and updates must enforce `ownerId == request.auth.uid`, and `list` queries must enforce `resource.data.ownerId == request.auth.uid`.
3. **Immutable Audit & Ownership Fields**: `ownerId`/`authorId` and `createdAt` can never be changed after creation. `createdAt` and `updatedAt` must strictly equal `request.time`.
4. **Community Channel Safety**: `/communityMessages/{messageId}` stores zero PII (`authorId`, `authorName`, `authorCourse`, `channel`, `text`, `createdAt`). Only verified authenticated users may read or post messages, `authorId` must equal `request.auth.uid`, and messages are immutable once posted (only deletable by the original author).
5. **Terminal Goal Locking**: Once a `SemesterGoal` reaches `status == 'completed'`, subsequent updates are blocked unless reactivated or deleted cleanly, or strictly bounded; specifically `status == 'completed'` is terminal so completed achievements cannot be tampered with.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Cross-user profile read**: User B attempts `get(/users/userA)`.
2. **User directory scraping**: Any user attempts `list(/users)`.
3. **Shadow field injection on Profile**: User A creates/updates `/users/userA` with extra key `isAdmin: true`.
4. **Owner spoofing on Subject**: User A creates `/users/userA/subjects/sub1` with `ownerId: "userB"`.
5. **Backdated timestamp**: User A creates a PomodoroSession with client-provided `createdAt` instead of `request.time`.
6. **Mutating immutable ownerId**: User A updates `/users/userA/tasks/t1` changing `ownerId`.
7. **Mutating completed goal**: User A updates a `SemesterGoal` whose existing `status == 'completed'`.
8. **ID Poisoning**: User A creates `/users/userA/notes/invalid$id!with*badchars`.
9. **Oversized string DoW**: User A creates a `StudyNote` with `content.size() > 20000`.
10. **Unbounded tags array**: User A creates a `StudyNote` with 15 tags (`tags.size() > 10`).
11. **Community impersonation**: User A creates `/communityMessages/m1` with `authorId: "userB"`.
12. **Unverified email write**: User with `email_verified: false` attempts to write to `/communityMessages`.
