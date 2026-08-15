# Delivery skill design

## Purpose

`delivery` is a shared Claude Code and Codex skill for taking ticket-based work from
mapping and decision-making through implementation and deliberate completion. It
combines Matt Pocock's ticket-location, triage, Wayfinder, grilling, and implementation
skills with Orca-managed terminals, worktrees, and supervised task dispatch. It does not
define a ticket tracker or duplicate Matt Pocock's ticket conventions.

The skill has three explicit modes. It must not infer a mode from ordinary prose:

| Mode | Invocation | Purpose |
| --- | --- | --- |
| Orchestration | `delivery orchestrate <tickets-or-map> [--wip N] [--agent auto|codex|claude] [--agent-args <args>]` | Coordinate dependency-aware ticket work. |
| Execution | `delivery execute <ticket> [--in-place] [--agent auto|codex|claude] [--agent-args <args>]` | Execute a ticket that is ready for an agent. |
| Completion | `delivery finish <ticket> --local-merge|--open-pr|--close-only` | Validate and perform the explicitly requested completion path. |

The default work-in-progress limit is four. The skill must render a compact ticket table
after every response, including when the requested operation made no state change.

## Package structure

The portable entry point lives at `skills/delivery/SKILL.md`. Its supporting instructions
are loaded only when required:

```text
skills/delivery/
  SKILL.md
  references/
    orchestration.md
    ticket-execution.md
    dispatch-contract.md
```

`SKILL.md` defines shared preflight, status, dependency, and safety rules. It directs the
agent to the selected reference only after an explicit mode has been parsed. No reference
may hard-code an issue-tracker API or identifier format.

## Shared behavior

Before creating or using Orca state, the skill resolves Orca through the installed
`orca-cli` guidance, verifies that its runtime is available, and loads Orca's current CLI
reference. Missing Orca or Matt Pocock dependencies are blocking errors: the skill reports
the exact missing dependency and stops rather than guessing a substitute command.

Matt Pocock's skills are the authority for locating tickets, recognizing ready-for-agent
state, interpreting maps and dependencies, creating follow-up tickets, and updating or
closing tickets. `delivery` only coordinates the work around that authority.

Dispatch uses generic capability tiers: `lightweight`, `standard`, and `frontier`. In
`--agent auto`, the coordinator chooses both provider family and tier from the task's
complexity, available providers, and best-effort quota information. The user can force
Codex or Claude with `--agent`. A quota check that cannot be made reliably produces a
visible warning but does not block dispatch.

`--agent-args <args>` is an optional, verbatim startup-argument string for the chosen AI
CLI, such as a Claude `--remote-control` option. The preflight displays the complete
resolved agent command before creating a terminal. Orca's managed worker launcher is used
when it supports the requested provider/model/effort options; otherwise the coordinator uses
Orca's documented custom-command terminal path, waits for TUI readiness, and then injects
the tracked task. Startup arguments are never invented, altered, or included in status
tables. Values that appear to contain credentials must not be echoed in reports or prompts.

The user-facing status table uses ticket-oriented states: `queued`, `blocked`, `ready`,
`dispatched`, `completed`, and `failed`. The table is the external account of what the
coordinator set out to do. Orca Run/Task/Dispatch records are internal durable bookkeeping
only; the skill never synchronizes them into the ticket tracker without a worker using the
Matt Pocock ticket workflow.

Manual Orca terminals are unmanaged and never count toward WIP. Only currently active
dispatches created by this delivery run count. A terminal that invoked
`delivery execute <ticket>` can be offered opt-in adoption into a matching active run;
the skill never auto-adopts it, and never offers adoption for an unrelated terminal.

## Orchestration mode

Orchestration accepts either ticket references or a Wayfinder map. It obtains the canonical
ticket/dependency view from Matt Pocock's triage or Wayfinder skills, creates or binds one
Orca Run, and mirrors that graph as internal Orca Tasks.

For each dependency-ready ticket, it selects one work kind:

| Work kind | Typical source | Workspace |
| --- | --- | --- |
| Decision | Grilling or a Wayfinder decision child | Fresh agent terminal in the active worktree. |
| Triage / Wayfinding | Parent ticket is not ready | Fresh agent terminal in the active worktree. |
| Prototype | Exploratory executable work | New child worktree. |
| Implementation | Ready coding ticket | New child worktree. |

If shared, uncommitted active-worktree state makes a child worktree unsafe, the coordinator
may choose the active worktree instead and must say why. Coding and prototype worktrees are
child worktrees of the active worktree. Worktree creation launches the selected agent with a
ticket-specific prompt; same-worktree decision and triage work launches a fresh terminal.

Before starting any worker, the coordinator must present a dispatch proposal table: ticket,
work kind, selected provider/tier, complete startup command (with sensitive values redacted),
workspace, resulting WIP, dependency rationale, and any quota warning. It waits for approval
before launching that wave.

The coordinator dispatches only ready tickets and never exceeds the WIP limit. It does not
poll, wake, or otherwise monitor workers automatically after returning control. On an
explicit `delivery orchestrate status` request or a later orchestration request, it reads
the internal Orca task/dispatch state, surfaces questions and blockers, and proposes a new
ready wave when capacity is available. This preserves asynchronous user-controlled progress
checks while retaining dependency state across turns.

## Execution mode

`delivery execute` assumes the supplied ticket is ready for an agent, not necessarily ready
to code. It uses Matt Pocock's triage or Wayfinder guidance to classify the work kind, then
loads the applicable Matt Pocock workflow. It does not enter plan mode. A ticket that is not
ready for any agent is not executed; instead, the skill offers a separate same-workspace
terminal for triage or Wayfinder work.

| Ready work kind | Execution workflow | Default workspace |
| --- | --- | --- |
| Decision | Grilling or the applicable decision workflow | Fresh terminal in the active worktree. |
| Grilling | Matt Pocock grilling | Fresh terminal in the active worktree. |
| Wayfinder child | Matt Pocock Wayfinder | Fresh terminal in the active worktree. |
| Prototype | Prototype workflow and validation | New child worktree. |
| Coding implementation | Matt Pocock implementation | New child worktree. |

When execution is already running in a ticket-specific worker worktree, it works there.
When directly invoked outside such a worker, it presents a preflight containing the ticket,
classified work kind, proposed workspace, selected agent/tier, complete startup command
(with sensitive values redacted), expected validation, and quota warning. It offers to launch
the session in that workspace. `--in-place` is the only route that permits direct edits in
the current workspace.

During work the agent updates the Orca worktree comment at meaningful checkpoints. At the
end it reports the outcome, validation or evidence, blockers or uncertainty, and smells or
follow-up recommendations. It offers to create selected follow-up tickets through Matt
Pocock's ticket workflow but never creates any silently. A successful session retains its
terminal, worktree when present, and running development environment for manual inspection.

## Completion mode

`delivery finish` requires one completion flag so success never implies authority to merge,
open a pull request, or close a ticket. It first verifies the ticket's reported evidence and
any required repository checks. A failed validation or missing decision/prototype evidence is
reported as failed and leaves the environment intact.

The selected action is exactly one of:

- `--local-merge`: merge locally using the repository's established workflow, then update or
  close the ticket through Matt Pocock's conventions.
- `--open-pr`: create a pull request using the repository's established workflow, then apply
  the appropriate ticket update.
- `--close-only`: update or close the ticket without a merge or pull request.

After successful completion, the worktree, terminal, and development process remain open by
default. Cleanup happens only when a chosen completion path requires it or the user
explicitly asks.

## Error handling and reporting

The skill reports exact failures rather than implying progress:

- A missing required dependency halts the requested operation.
- An unresolved ticket dependency is `blocked`, not dispatched.
- A worker's uncertainty or ownership question is surfaced on the next explicit progress
  request; the coordinator does not invent an answer.
- Validation failures include the failed command and a concise output summary.
- A successful worker result is not ticket completion; only `finish` performs the requested
  ticket/merge/PR action.

Every response ends with a compact table. Orchestration uses `Ticket`, `Description`, and
`Status`. Execution and completion use `Area`, `Status`, and `Detail`, and include an
optional follow-ups row when smells or future work were identified.
