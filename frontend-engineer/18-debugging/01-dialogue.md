> A: This button is broken. It was working yesterday.
> B: Did something change?
> A: Not that I know of. Let me check the git log.
> B: Someone merged a PR last night. Let me see what they changed.
> A: (checks) Looks like Tom updated the API client. That might have broken it.
> B: Let's revert his change and see if it fixes it.
> A: Let me try something first. Let me comment out the new code and test.
>
> (later)
> A: Yeah, it's Tom's change. The new API client is missing a header that the button needs.
> B: Let me talk to Tom. Can you add a quick fix in the meantime?
> A: I can add the missing header. Let me push a hotfix.
> B: Let's also add a test so it doesn't break again.
> A: Good idea. I'll write a unit test for it.
>
> A: I also pasted the error into AI. It suggested the same thing — missing header.
> B: So AI confirmed our diagnosis.
> A: Yeah. It's getting better at debugging.
