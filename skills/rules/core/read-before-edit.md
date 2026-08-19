# Read before edit

Read the whole thing before you change part of it.

pstack's `principle-fix-root-causes` covers debugging. This covers editing, where the file compiles,
nothing is obviously broken, and you change a piece of it anyway without having read the rest.

## When this fires

Before the first edit to any file you have not read end to end in this session. Also before editing a
component whose behavior I described as wrong, since the cause is usually somewhere you have not
looked.

## Procedure

1. Read the file end to end. Not a grep window, not the function you think is responsible. If it is
   too large to read whole, read it in full passes and say which parts you skipped.
2. Follow the values you are about to change to where they come from and where they go. A token, a
   prop, a class string, or a state variable usually has a source and other consumers.
3. Say what is causing the behavior before proposing the fix. One sentence. If you cannot write that
   sentence, you have not read enough.
4. Then edit, changing only what that sentence names.

## Anti-patterns

Do not edit a file you have only seen through search results.

Do not fix a symptom in the component where it appears when the value arrives from somewhere else.

Do not rewrite surrounding code you did not need to touch. What was already right stays right. I have
corrected this exactly: "what you did for all 92 products were perfect. I asked you to remove ui that
was explaining the ui, but the ui was perfect."

Do not guess at cause. "Read the entire component first, figure out why this happens" is the
correction this rule exists to prevent.
