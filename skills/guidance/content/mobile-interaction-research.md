# Research behind "How a mobile client behaves"

The external facts and reasoning behind the rules in `mobile-interaction.md`
— not a survey of any specific app's codebase. An app doing its own survey
(the way gather did, in its own `docs/research/mobile-interaction-vocabulary.md`)
should keep that as its own document; this one stays deliberately
app-agnostic.

## Posture: iOS is the reference, Android is the honest port

The app should feel like the OS it is running on, not like a
cross-platform compromise. On iOS 26 that means Liquid Glass chrome,
native sheets with detents, `UIMenu` context menus, and the Taptic
vocabulary users already know. Android gets the same *behaviour* drawn by
Material, not the same pixels — where Material genuinely disagrees with
UIKit (snackbars vs. no snackbars, overflow menus vs. long-press menus,
the back gesture), the Android answer is Material's.

Recompiling against the iOS 26 SDK gives system controls the Liquid Glass
treatment automatically. Expo's Native Tabs documentation states that on
iOS 26 the tab bar derives its background from the content beneath it —
background props have no effect there [Expo — Native tabs]. That is why
the tab bar rule needs no code: it is already glass.

`expo-glass-effect` (bundled with SDK 56+, works in Expo Go) is a separate
story for an app's *own* glass surfaces: iOS 26+ only (falls back to a
plain `View` elsewhere), needs a runtime availability check
(`isGlassEffectAPIAvailable()`), and `opacity: 0` disables the effect
entirely rather than fading it [Expo — GlassEffect]. The design guidance is
mostly a list of don'ts: no `blur`/`opacity`/`background` on a glass view,
no solid fill behind one, no nested glass containers, no second glass
layer on toolbars/tab bars that already have one (WWDC25 §284 and
community write-ups). Reading: glass is chrome that floats over scrolling
content, not content itself — a floating control or two is the honest
scope for most apps.

## Sheets

The HIG's position on the shape itself (excerpt, unverified against the
live page — see "Verification status" below): the system defines `medium`
(≈half height) and `large` detents; a resizable sheet should include a
grabber, which both signals resizability and cycles detents on tap; the
medium detent is for progressive disclosure, and compose-style sheets that
need the room should be large-only [Apple HIG — Sheets, excerpt].

A platform-native sheet component (Expo Router's `formSheet` presentation,
or `@expo/ui`'s `BottomSheet`, both riding on the real
`UISheetPresentationController` / Material bottom sheet) gets this for
free. A hand-built `Modal` + scrim does not: no drag-to-dismiss, no
detents, no native material. That is the whole case for the sheet-mechanism
rule.

## Long press and context menus

`@expo/ui`'s SwiftUI `ContextMenu` produces a real system context menu on
iOS (with the system's preview-and-blur presentation) and a Compose
`DropdownMenu` on Android, adding no native module outside the Expo
release train. The alternative that produces an equally real `UIMenu` —
Zeego, wrapping `react-native-ios-context-menu` — needs a dev client
(routine for any Expo app with a development build already) but is a
second native module stacked on top of another, which is the case against
reaching for it unless `@expo/ui`'s menu turns out not to support the
preview presentation.

The rule that survives whichever option an app picks: a long press is
never the only way to reach an action — everything in a context menu
should also be reachable from the row's detail screen.

## The haptic vocabulary

`expo-haptics`'s API: `impactAsync` (`Light`/`Medium`/`Heavy`/`Rigid`/
`Soft`), `notificationAsync` (`Success`/`Warning`/`Error`),
`selectionAsync()`, and `performAndroidHapticsAsync` for Android-specific
patterns [Expo — Haptics].

Two constraints shape the vocabulary. First, the platform one: iOS
silently plays nothing when Low Power Mode is on, when the user has turned
system haptics off, while the camera is active, or during dictation.
Second, the guidance one — the HIG's line (excerpt) is that haptics
*supplement* visual feedback and that system-defined haptics should be
used consistently so people are not confused [Apple HIG — Playing
haptics, excerpt]. Together: a haptic is never the only signal that
something happened.

## Press states

Every React Native app defaults to `opacity: 0.6` on `Pressable`, and it
is wrong on both platforms: iOS highlights a *row* with a background fill
rather than fading its content, and Android draws a ripple from the touch
point. `react-native-gesture-handler` ships its own `Pressable` with
`android_ripple` support, which matters as soon as a pressable lives
inside something that scrolls or swipes.

## Optimistic writes

Convex's `withOptimisticUpdate` on mutations, with `localStore.getQuery`/
`setQuery` and automatic rollback when the mutation resolves, carries one
hard rule: never mutate objects in the update — new objects only, or the
client's internal state corrupts [Convex — Optimistic updates]. That is
why the rule scopes optimism to writes whose *creation* is what's
optimistic (completing, toggling, adding), not to edits of existing
state.

## Verification status

Fetched and read directly: Expo's GlassEffect, Haptics, UI (`@expo/ui`),
`@expo/ui` BottomSheet, and Native Tabs documentation; Convex's optimistic
updates documentation. Apple's Human Interface Guidelines could not be
fetched in the environment this research was compiled in — the HIG is a
client-rendered site whose data endpoints 404 behind some proxies — so HIG
content here comes from search excerpts, marked `(excerpt)` above.
**Confirm the sheet-detent guidance and the haptics best-practices lines
against the live HIG pages before treating them as settled:**
[Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets),
[Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics).

[Expo — Native tabs]: https://docs.expo.dev/router/advanced/native-tabs/
[Expo — GlassEffect]: https://docs.expo.dev/versions/latest/sdk/glass-effect/
[Expo — Haptics]: https://docs.expo.dev/versions/latest/sdk/haptics/
[Convex — Optimistic updates]: https://docs.convex.dev/client/react/optimistic-updates
