# Security Specification — Vinted-Verkaufshelfer

## 1. Data Invariants

1. **Authenticated & Verified Access Only**: Every Firestore read and write requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **PII Isolation**: Private user records under `/users/{userId}` are readable and writable exclusively by the matching `request.auth.uid == userId`.
3. **Household Membership Gate**: Access to `/households/{householdId}` and its subcollections (`/members`, `/items`) is restricted strictly to the household owner (`ownerUid == request.auth.uid`) or users whose verified email is in `invitedEmails` and who hold a matching `/members/{request.auth.uid}` document.
4. **Immutable Ownership & Timestamps**: `id`, `authorUid`, `ownerUid`, `ownerProfile`, and `createdAt` cannot be modified after creation. `createdAt` and `updatedAt` must equal `request.time`.
5. **Terminal State Locking**: Once a `VintedItem` has `status == 'sold'`, it is permanently locked against further updates (`existing().status == 'available'` is required on updates).
6. **No Shadow Fields / Bounded Arrays**: Every `create` validates exact required and allowed keys (`hasAll` + `hasOnly`). `images` (1..4 strings <= 250,000 chars), `hashtags` (0..12 strings <= 60 chars), `invitedEmails` (1..5 emails), and `memberUids` (1..5 UIDs) are strictly bounded.
7. **Zero-Trust List Queries**: `allow list` never uses `get()` or `exists()` and always enforces `request.auth.uid` against `resource.data`.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Unauthenticated Item Create**: `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `request.auth.token.email == 'mattionlineservices@gmail.com'`, `email_verified == false` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Item Create**: `authorUid: 'other-user-uid'` != `request.auth.uid` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Extra field `isAdmin: true` in item payload -> `PERMISSION_DENIED`.
5. **Shadow Update Injection**: Updating item with extra field `authorUid: 'new-uid'` or `createdAt` change -> `PERMISSION_DENIED`.
6. **Terminal State Bypass**: Trying to update `soldPrice` or revert `status` to `'available'` on an item whose `existing().status == 'sold'` -> `PERMISSION_DENIED`.
7. **Client Timestamp Forgery**: Setting `createdAt` to a past timestamp instead of `serverTimestamp()` (`request.time`) -> `PERMISSION_DENIED`.
8. **Invalid Document ID Poisoning**: Creating `/items/bad$id/..` or 500-char ID -> `PERMISSION_DENIED`.
9. **Array Resource Exhaustion**: Sending 10 images or a 1.5MB string inside `images[0]` -> `PERMISSION_DENIED`.
10. **Cross-User PII Read**: Authenticated user A reading `/users/userB` -> `PERMISSION_DENIED`.
11. **Unauthorized Household Join**: Non-invited user trying to create `/households/{id}/members/{uid}` -> `PERMISSION_DENIED`.
12. **Blanket List Query Scraping**: Listing `/items` without filtering by `memberUids` array-contains `request.auth.uid` -> `PERMISSION_DENIED`.
