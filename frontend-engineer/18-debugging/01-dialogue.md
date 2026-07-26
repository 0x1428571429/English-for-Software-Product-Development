> A: This button is broken. It was working yesterday.
> B: Did something change?
> A: Not that I know of. Let me check the git log.
> B: Someone merged a PR last night. Let me see what they changed.
> A: Looks like Tom updated the API client. That might have broken it.
> B: Let's revert his change and see if it fixes it.
> A: Let me try something first. Let me comment out the new code and test.
>
> (later)
> A: Yeah, it's Tom's change. The new API client is missing a header.
> B: Let me talk to Tom. Can you add a quick fix in the meantime?
> A: I can add the missing header. Let me push a hotfix.
> B: Let's also add a test so it doesn't break again.
> A: Good idea. I also pasted the error into AI and it suggested the same thing.
> B: So AI confirmed our diagnosis.
> A: Yeah. It's getting better at debugging.
>
> (Next week)
> A: Staging is broken again. Same button, same error.
> B: What? I thought we fixed it.
> A: The hotfix worked but now someone deployed the old version over it.
> B: Let me check the deploy log... yeah, someone re-deployed the old code by accident.
> A: We need a better deployment process.
> B: Agreed. Let's bring it up in the retro.
