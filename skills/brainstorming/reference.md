# Reference: brainstorming

## Best Practices

- Favor breadth first, depth second; avoid prematurely committing
- Include constraints: time, risk tolerance, team skills, existing infra
- Use quick filters: complexity, blast radius, dependency count, reversibility
- When unsure, pair with `writing-plans` to turn winning option into an executable plan

## Heuristics

- **Complexity**: How many moving parts?
- **Blast radius**: What could break if this fails?
- **Dependencies**: External services, libraries, team coordination
- **Reversibility**: Can we easily undo if it doesn't work?

## Common Pitfalls

- Anchoring on first idea
- Ignoring non-technical constraints (timeline, team capacity)
- Over-engineering vs. pragmatic solutions
