# input

Read the keyboard and mouse from `ctx.input` in a behavior or process.

## keyboard

```ts
if (ctx.input.isKeyHeld("KeyD")) moveRight();
if (ctx.input.isKeyDown("Space")) jump();     // only the frame it was pressed
if (ctx.input.isKeyUp("Space")) endJump();    // only the frame it was released
```

| method | true when |
|---|---|
| `isKeyDown(code)` | the key was pressed since the last frame (true for one frame) |
| `isKeyHeld(code)` | the key is down right now (from the frame it was pressed until the frame it's released) |
| `isKeyUp(code)` | the key was released since the last frame (true for one frame) |

Keys are named by their **physical position**, using the browser's [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values) names, so WASD works on any keyboard layout:

| key | code |
|---|---|
| letters | `"KeyA"` … `"KeyZ"` |
| number row | `"Digit0"` … `"Digit9"` |
| arrows | `"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"` |
| others | `"Space"`, `"Enter"`, `"Escape"`, `"ShiftLeft"`, `"ControlLeft"`, `"Tab"` |

Held-key auto-repeat is ignored: holding a key gives one `isKeyDown`, not many.

## mouse

```ts
if (ctx.input.isMouseDown("left")) shoot();
const mouseWorld = ctx.camera.toWorldPosition(ctx.input.mouseScreenPosition());
```

| method | true when |
|---|---|
| `isMouseDown(button)` | pressed since the last frame |
| `isMouseHeld(button)` | down right now |
| `isMouseUp(button)` | released since the last frame |

Buttons are `"left"`, `"middle"` and `"right"`.

`mouseScreenPosition()` is in pixels from the **center** of the game's element, **y up**. Convert it with `ctx.camera.toWorldPosition(...)` to compare it with objects (see [coordinates](coordinates.md#screen-and-mouse)).

To react to clicks on a specific object, give it a `Collider` and use [`OnclickEvent`](requests-and-events.md#onclickevent).

## limits

- **`mouseScreenPosition()` throws until the mouse has moved over the game.** Wrap the first reads in `try`/`catch`:
  ```ts
  let mouse: Vector2 | null = null;
  try { mouse = ctx.input.mouseScreenPosition(); } catch { /* not over the game yet */ }
  ```
- Input listens on the element the game is mounted on. Keys only arrive while that element (or something inside it) has focus. Mounting on `document.body` is the simplest way to always get them.
- Every key's browser default is blocked while the game has focus (`preventDefault`), including shortcuts such as F5 and Ctrl+R.
- There's no gamepad or touch input yet.
