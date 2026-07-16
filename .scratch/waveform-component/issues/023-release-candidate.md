# 023 — Prove package consumption, document the system, and cut the release candidate

Status: blocked

Type: AFK  
Blocked by: 022  
User stories: 1–6, 66–70, 84–85, 95–98, 102–115

## Outcome

The package, playground, generated examples, documentation, verification commands, and Git history form an evidence-backed release candidate consumable outside the repository.

## Work

1. Prove package exports, declarations, SSR-safe import, and representative runtime use in the isolated external consumer.
2. Document architecture, source ownership, frames, config schemas, controls, renderer capabilities, effects, examples, accessibility, performance, and verification.
3. Align lint, format, typecheck, unit, component, coverage, build, E2E, and CI commands with the inherited toolchain.
4. Run the final full verification batch, inspect artifacts, reconcile failures, and perform the final quality gate/autopsy.
5. Audit status/scope/license provenance and divide verified work into logical descriptive commits without deploying or pushing.

## Acceptance

- Local and CI lint, format, typecheck, test, coverage, build, and E2E commands pass.
- Package and generated examples compile and run outside the playground.
- Documentation matches the shipped public exports and real capability limits.
- No blocker or P1 remains; every required quality gate has direct evidence or an honest non-applicable rationale.
- Repository status and commit history are understandable, scoped, and free of accidentally tracked reference/evidence artifacts.
