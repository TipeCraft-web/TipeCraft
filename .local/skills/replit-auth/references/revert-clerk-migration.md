---
name: revert-clerk-migration
description: Revert authentication from Clerk back to Replit Auth.
---

# Reverting from Clerk to Replit Auth

Revert flow from Clerk back to Replit Auth. The strategy is: revert the platform migration state first, then roll back the code to the pre-migration checkpoint.

## When to Use

- User asks to revert from Clerk to Replit Auth
- User asks to undo the Clerk migration
- User asks to go back to Replit Auth

## Step 1: Check Migration Status

Use the `codeExecution` tool to call `getClerkMigrationStatus` to check whether a Replit Auth to Clerk migration exists:

```javascript
const result = await getClerkMigrationStatus();
console.log(result);
```

If the status is `"none"`, this repl was never migrated from Replit Auth to Clerk. Do not proceed with any further steps. Let the user know that there is no supported way of migrating existing users from Clerk into Replit Auth.

## Step 2: Confirm with User

Before proceeding, call the `AskQuestion` model tool to get explicit confirmation:

```json
{
  "question": "Reverting your Clerk auth migration will unlink the Clerk app from your project and roll back your code to the checkpoint before the migration. Any users created in Clerk after the migration will be lost, and any code changes made after the migration will also be rolled back. Would you like to proceed?",
  "choices": ["Yes, proceed", "No"]
}
```

If the user does not choose "Yes, proceed", stop and do not call any migration rollback callback.

If the user declines, stop and do not proceed.

## Step 3: Revert Platform Migration State

Use the `codeExecution` tool to call `revertClerkMigration` to mark the migration as reverted on the platform:

```javascript
const result = await revertClerkMigration();
console.log(result);
```

This unlinks the Clerk app from the project and restores the platform to Replit Auth mode. If the call fails, report the error and stop.

## Step 4: Roll Back Code to Pre-Migration Checkpoint

Before suggesting rollback, tell the user what to look for in the checkpoint picker. Explain that they should select the checkpoint from **before** the Clerk migration started — it will typically be the one right before any commit mentioning "Clerk" or "authentication migration". Mention the approximate time or description if you can infer it from context or reading git history.

Then call `SuggestUserAction({ action: "rollback", message: "Roll back to the checkpoint before the Clerk auth migration." })`.

After the button appears, remind the user to click "View Checkpoints" and select the pre-migration checkpoint you described.

**Why checkpoint rollback works here:** The platform migration state was already reverted in Step 3. The checkpoint restores the exact pre-migration code — the original auth middleware, routes, client components, database schema, and dependencies — with no manual reconciliation needed.

## Step 5: Post-Rollback Verification

After the user completes the checkpoint rollback:

1. **Verify the app starts:** Restart the application workflow and confirm it boots without errors.
2. **Verify login works:** Ask the user to test logging in. If they see `invalid_grant` errors at `/api/callback` immediately after the restart, this is normal — any login flow that was in progress when the server restarted will fail. The user just needs to log in again from a fresh tab.
3. **Update replit.md:** Update `replit.md` to reflect that authentication uses Replit Auth (not Clerk). Remove any mentions of Clerk from the authentication section.
