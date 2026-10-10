---
name: workflows
description: Manage application workflows including configuration, start, stop, restart, and removal.
---

## Overview

A workflow binds a shell command (e.g., `npm run dev`, `python run.py`, `cargo run`) to a long-running task managed by Replit. Workflows are used to run webservers, background services, TUIs, and other persistent processes.

**Key characteristics:**

- Workflows run until explicitly stopped
- The system tracks workflows automatically -- no separate configuration file is required
- Workflows auto-restart after package installation and module installation
- You can only get console logs from a workflow if it is running


## Artifact-Owned Workflows

Each service declared in `artifacts/<slug>/.replit-artifact/artifact.toml` already owns a managed workflow named `artifacts/<slug>: <service-name>`. Start or restart these services with the direct `WorkflowsRestart` tool. For example:

- API server: `{ "name": "artifacts/api-server: API Server" }`
- Notes frontend: `{ "name": "artifacts/notes-app: web" }`

**Do not call the `configureWorkflow` callback for an artifact service.** Managed artifact workflows inject service configuration including `PORT`, `BASE_PATH`, and proxy routing. Configuring a replacement workflow can omit that configuration or create a legacy artifact that conflicts with the real artifact's preview path.

Use the `configureWorkflow` callback only for a long-running process that is not represented by a registered artifact service.


## Setup Tips

1. **Keep workflows minimal**: One workflow per project is usually sufficient. Use the main frontend server or TUI as your primary workflow.

2. **Choose the right workflow**: If your project has a frontend or TUI, set the workflow to the process that updates what the user sees.

3. **Clean up unused workflows**: When adding new workflows, remove any existing workflows that are no longer needed.

4. **Always restart after changes**: Restart workflows after making server-side code changes to ensure updates are visible to the user. Verify they run without errors before returning to the user.

5. **Use bash for one-off commands**: Workflows are for persistent processes. Use bash for build scripts, testing, or commands that don't need to keep running.

## When to Use

Use this skill when:

- You need to create or configure a workflow (background process)
- You need to restart the application after making code changes
- The application needs to be restarted to pick up new environment variables
- You need to remove a workflow that's no longer needed
- The user asks to start, stop, or restart the application

## When NOT to Use

- For debugging runtime errors (fix the code first, then restart)
- When the application is already running and changes are hot-reloaded
- One-off commands (use bash for commands that don't need to persist)
- Build scripts (use bash for npm build, webpack, etc.)
- Testing commands (use bash or read the testing skill for testing subagent)
- More than 10 workflows (keep workflows minimal; combine services if needed)

## Available Functions

The TypeScript runtime registers `listWorkflows`, `getWorkflowStatus`, `configureWorkflow`, `restartWorkflow`, `stopWorkflow`, and `removeWorkflow`.

The functions below are `CodeExecution` callbacks. Outside a `CodeExecution` script, use the direct `WorkflowsRestart` tool for workflow starts and restarts.

### listWorkflows()

List configured workflows with their `name`, `command`, and `state` (`not_started`, `running`, `finished`, or `failed`).

```javascript
const workflows = await listWorkflows({});
console.log(workflows);
```

### getWorkflowStatus({ name, maxScrollbackLines })

Get one workflow's state, command, open ports, configured port, and recent output. `maxScrollbackLines` defaults to 100 and is capped at 1000; set it to 0 to skip output.

```javascript
const status = await getWorkflowStatus({ name: "Start application" });
console.log(status);
```

### configureWorkflow({ name, command, waitForPort, outputType, autoStart, isCanvasWorkflow })


Configure or create a workflow only for a process that is not already represented by an artifact service. To start or restart artifact services, use the direct `WorkflowsRestart` tool described above.


**Parameters:**

- `name` (str, default "Start application"): Unique workflow identifier
- `command` (str, required): Shell command to execute
- `waitForPort` (int, optional): Port the process listens on
- `outputType` (str, default "webview"): "webview", "console", or "vnc"
- `autoStart` (bool, default false): Start the workflow after configuration
- `isCanvasWorkflow` (bool, default false): Whether this workflow serves canvas iframe content

**Output Type Rules:**

- **webview** - For web applications. Can use any supported port.
- **console** - For backend services, CLIs, TUIs. Can use any supported port.
- **vnc** - For desktop/GUI apps (Electron, PyQt, etc.). No port needed.

**Supported Ports:** 3000, 3001, 3002, 3003, 4200, 5000, 5173, 6000, 6800, 8000, 8008, 8080, 8099, 9000

**Examples:**

```javascript
// Web application (React, Next.js, etc.)
await configureWorkflow({
    name: "Start application",
    command: "npm run dev",
    waitForPort: 3000,
    outputType: "webview",
    autoStart: true
});

// Backend API
await configureWorkflow({
    name: "Backend API",
    command: "python api.py",
    waitForPort: 8000,
    outputType: "console",
    autoStart: true
});

// Desktop application
await configureWorkflow({
    name: "Desktop App",
    command: "python gui_app.py",
    outputType: "vnc",
    autoStart: true
});
```


### stopWorkflow({ name })

Stop a running workflow without removing its configuration. Use this when the user asks to pause or turn off a workflow that they may want to start again later.

```javascript
await stopWorkflow({ name: "Backend API" });
```

### removeWorkflow(name)

Remove a workflow by name. Automatically stops it if running.

**Parameters:**

- `name` (str, required): Name of the workflow to remove

**Returns:** Dict with `success`, `message`, `workflowName`, and `wasRunning`

**Example:**

```javascript
await removeWorkflow({ name: "Backend API" });
```

### restartWorkflow(workflowName, timeout)

Restart a workflow by name.

**Parameters:**

- `workflowName` (str, required): Name of the workflow (e.g., "Start application")
- `timeout` (int, default 30): Timeout in seconds to wait for restart

**Returns:** Dict with restart status and optional screenshot URL

**Example:**

```javascript
// Restart the main application
const result = await restartWorkflow({ workflowName: "Start application" });
console.log(result.message);

// Restart with custom timeout
const result2 = await restartWorkflow({
    workflowName: "Start application",
    timeout: 60
});
```

## Best Practices

1. **Restart after code changes**: Always restart workflows after modifying server-side code
2. **Use appropriate timeouts**: Increase timeout for applications with slow startup
3. **Check logs on failure**: If restart fails, check workflow logs for error details
4. **One restart at a time**: Avoid parallel restarts of the same workflow

5. **Match port to your app**: Use the port your application actually listens on


## Common Workflow Names


- `artifacts/<slug>: <service-name>` - Managed artifact service; use the exact service name from `artifact.toml`
- `artifacts/api-server: API Server` - Shared API artifact service
- `artifacts/<slug>: web` - Typical React/Vite artifact service


## Error Handling

The workflow functions may raise errors in these cases:

- **Workflow not found**: The specified workflow name doesn't exist
- **Port not opened**: The application didn't start listening on expected port
- **Preview not available**: The application endpoint isn't responding with HTTP 200
- **Workflow limit exceeded**: Maximum of 10 workflows reached


When errors occur, check:

1. Workflow logs for error details
2. Application code for startup issues
3. Port configuration in the workflow settings

## Example Workflow


Use the direct `WorkflowsRestart` tool for existing artifact services; their workflows supply `PORT` and `BASE_PATH`:

- API server tool input: `{ "name": "artifacts/api-server: API Server" }`
- Notes frontend tool input: `{ "name": "artifacts/notes-app: web" }`

