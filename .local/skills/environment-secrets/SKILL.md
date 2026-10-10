---
name: environment-secrets
description: Manage environment variables and secrets. View, set, delete env vars and request secrets from users.
---

# Environment And Secrets Skill

Use this skill to inspect and manage project environment variables and to request sensitive values from the user.



## Available Functions

The functions below describe supported callbacks. Availability depends on the current code-execution runtime, so call only callbacks that are present. Call callbacks with a single JSON object argument.

### viewEnvVars({ type, environment, keys })

View environment variables and/or secret existence.

Parameters:

- `type` (optional): `env`, `secret`, or `all`. Defaults to `all`.
- `environment` (optional): `shared`, `development`, or `production`. For `development` or `production`, shared env vars are also included.
- `keys` (optional): list of keys to filter to.

Environment variables return actual values grouped by environment. Secrets return existence status only, never values.

```javascript
return await viewEnvVars({ type: "all" });
```

### requestSecrets({ keys, userMessage })

Check that `requestSecrets` is available in the current runtime before offering a secure form. If it is missing, do not call it or claim that a form can be opened. Never ask for API keys, tokens, passwords, private keys, or credentials in chat or in a non-secret form.

When available, call it to request sensitive values and stop the current turn. The user enters values into a secure form. Secret values are saved as Replit Secrets and are not returned to you.

```javascript
if (typeof requestSecrets !== "function") {
  return { secureFormOpened: false, reason: "requestSecrets is unavailable" };
}
return await requestSecrets({
  keys: ["OPENAI_API_KEY"],
  userMessage: "Please provide your OpenAI API key.",
});
```


If the example returns `secureFormOpened: false`, no form was opened. Do not tell the user a form is open. Direct the user to add the key in Tools > Secrets for the Replit project that needs it.



### requestEnvVars({ envVars, userMessage })

Ask the user for non-secret environment variable values and stop the current turn.

```javascript
if (typeof requestEnvVars !== "function") {
  return { formOpened: false, reason: "requestEnvVars is unavailable" };
}
return await requestEnvVars({
  envVars: [{ key: "LOG_LEVEL", environment: "shared" }],
});
```


Call a form-request callback as the final callback in the code-execution snippet. The user submits a form outside the code execution runtime; a future turn will include a status message indicating whether the requested values were saved. Secret values are never shown back to you.

### setEnvVars({ values, environment })

Set non-secret environment variables.

Parameters:

- `values` (required): object of key-value pairs.
- `environment` (optional): `shared`, `development`, or `production`. Defaults to `shared`.

Use `requestSecrets` for sensitive values. This callback rejects runtime-managed keys.

```javascript
return await setEnvVars({
  environment: "shared",
  values: { NODE_ENV: "production" },
});
```

### deleteEnvVars({ keys, environment })

Delete non-secret environment variables from the specified environment.

```javascript
return await deleteEnvVars({
  environment: "shared",
  keys: ["NODE_ENV"],
});
```

## Guidance

- Default to the `shared` environment unless the user needs distinct development and production values.
- An environment variable in `shared` conflicts with the same key in `development` or `production`. Delete the conflicting key first, then add it in the target environment.
- Never set secrets with `setEnvVars`; use `requestSecrets({ keys, ... })`.
- Do not print secret values. `viewEnvVars` only tells you whether secrets exist.
- Runtime-managed keys currently include `DATABASE_URL`, `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `REPLIT_DOMAINS`, `REPLIT_DEV_DOMAIN`, `REPL_ID`, `REPLIT_ENVIRONMENT`, `REPLIT_CLUSTER`. Do not request or set those manually.
