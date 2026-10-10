# Publishing the App Yourself

The build agent can publish the user's app with `publishRepl()`. This document is the contract for that callback.

Read this document before you call `publishRepl()`. If you are not the build agent, do not call it. The dispatcher rejects the call.

If you are in Plan mode, do not call it. Publishing changes the environment, so Plan mode blocks the call. A blocked call raises an error. You get no result and no deploy card. The rest of this document does not apply.

## Rules

1. **When the user asks, or after you fix a publish failure, call `publishRepl()`.** Do not call it because the app looks finished. Do not call it because a task ended well.
2. **Publishing is fire-and-forget.** The call returns as soon as the build is scheduled. Do not wait for the build. Do not write a polling loop.
3. **A scheduled build is not a live app.** A success result means the build started. It does not mean the app is serving the new code.
4. **`SuggestUserAction` is not a way to recover from a failed publish.** See the last section.

## publishRepl()

Takes no arguments. Publishes the repl that owns this session.

```javascript
const result = await publishRepl();
```

The call is denied while any environment is connected. If no environment is connected, call `publishRepl()`. If an environment is connected, use `SuggestUserAction({ action: "deploy", message: "The app is ready to publish." })` instead. `getDeploymentInfo()` follows a connection, so it can report a different repl. `publishRepl()` only publishes the repl that owns this session.

If the app has never been published, this tries to publish it with default settings, including its region. Some apps cannot be published this way the first time, and the roadblock message says so. A user who wants a specific region has to publish from the workspace the first time.

Returns one of five shapes. Handle each one:

| Result | Meaning | What to do |
| --- | --- | --- |
| `success: true, published: true` | A build is scheduled. `deploymentId`, `buildId`, and `status` describe it. | Tell the user that publishing started. Do not say the app is live. Stop. |
| `success: true, published: false` | The server refused. `roadblockCode` and `roadblockMessage` say why. | See Roadblocks below. |
| `success: false, published: false`, message about a timeout | The request timed out. The publish status is unknown. | Tell the user that the publish status is unknown. Ask them to check the Deployments pane. Do not retry. |
| `success: false, published: false`, message about availability | Publishing on your behalf is off in this session. | Tell the user to publish from the workspace. |
| `success: false, published: false`, with an `error` field | The call failed. The publish status is unknown. | Tell the user that the publish status is unknown. Ask them to check the Deployments pane. Do not retry. |

## Roadblocks

A roadblock means the server declined. It is not an error, and it is not a failure you caused.

`roadblockMessage` is written for the user and names the exact condition. Relay it. Do not invent your own wording, and do not guess at a cause the message does not give.

Do not match on `roadblockCode`. The deploy pipeline owns that list and changes it. Read the message and apply the first rule that fits:

1. **It asks the user to change something.** Examples include a paused database, a disconnected account, a schema review, or a first publish. Relay the message and stop. Do not retry until the user completes the action and asks you to publish again.
2. **It says to wait, or that a deploy is already running.** Tell the user what it says. Do not call `publishRepl()` again in this turn.
3. **It names a problem in the code or the configuration that you can fix.** Fix it. Then call `publishRepl()` one more time.
4. **It says the state changed and to try again.** Call `publishRepl()` one more time.
5. **Anything else.** Relay the message and stop.

The order matters. A message that asks the user for something and also mentions retrying is rule 1, not rule 4.

Never call `publishRepl()` more than twice in one turn.

## Republishing After a Fix

This is the main reason you can publish. A fix for a failed publish is worth nothing until it ships.

After you fix a publish failure, republish. When the user asks you to publish, republish. For any other fix, ask the user first. This includes a production fault you diagnosed.

1. Fix the problem.
2. Make sure the app works.
3. Call `publishRepl()`.
4. If the result has `published: true`, tell the user what you fixed and that publishing started.
5. Otherwise, use the matching result instructions above.

After you publish, do not run the deploy-failure investigation again. The build takes 30 seconds to 3 minutes. Do not wait for it.

## Checking the Result Later

When the user asks how the publish went, call `getDeploymentBuild()` with the returned `buildId`. Nothing tells you when the build finishes. Do not wait for a message that announces it.

Call `getDeploymentBuild()` from the user's repl. It follows your connection, and the build belongs to their repl. If an environment other than the user's repl is connected, do not call it. Tell the user that you cannot check this build from the current connection.

## Do Not Retry With SuggestUserAction

On a repl enrolled in agent publishing, a deploy suggestion is sometimes a publish rather than a button. When the user's own message drove this turn, and you are on their repl, `SuggestUserAction({ action: "deploy" })` schedules its own publish after the turn ends. On a turn the user did not send, it stays an ordinary Publish card. In Plan mode it also stays an ordinary card.

So a deploy suggestion is not a retry. It matters most right after the user asked you to publish. There the suggestion repeats the attempt, usually hits the same condition, and the user watches two attempts fail. You never see the second result, so you cannot tell them what happened.

After a roadblock, or any result you cannot act on, write the answer in your reply instead. Tell the user what blocked the publish and what to do next.

This section is about retrying. When you first send a deploy suggestion, use the main deployment skill. On an enrolled repl that suggestion can publish by itself, and that is the feature working as intended.

## After a Refused Call

A deploy card appears as soon as you call `publishRepl()`, so the user sees the attempt even when the server refuses it. Say what happened and what to do next. Do not talk as though you never tried.
