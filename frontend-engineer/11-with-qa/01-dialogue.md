> A: Hey, I found a bug in the login flow.
> B: Which one? I fixed a login bug yesterday.
> A: It might be the same one. The account stays locked even after entering the correct password.
> B: That sounds like the one I fixed. Can you check on the latest build?
> A: I'm on staging. Let me pull the latest and try again.
>
> A: Still happening. Let me send you the steps. Go to login, enter wrong password 3 times, then enter the correct one. It still says "account locked."
> B: Let me try... I can't reproduce it. Does it happen every time?
> A: On staging, yes. Not on local.
> B: Might be a cache issue. Can you clear your cache?
> A: I already did. Still happens.
> B: Let me check the staging config. Could be different from local.
>
> A: Also, I found another issue. When I log in with Google SSO, the name doesn't show up on the profile page.
> B: That's existing behavior. It's not related to my change.
> A: OK. Should I file a separate bug?
> B: Yeah, file it. I'll look at it next sprint. This sprint is full.
> A: Can I prioritize it over the new button feature? I think this is more important.
> B: I'd say it's a minor issue. The login lock is a blocker though.
>
> A: Can AI help with the login bug?
> B: I already asked AI. It suggested checking the rate limiter config, which was correct. The staging config was wrong.
> A: So it's not a code issue?
> B: Nope. Config issue. Let me fix it and deploy.
>
> (Next day)
> A: The login fix worked. I tested it on staging and it's fine now.
> B: Good. Can you verify on production too?
> A: Sure. I'll deploy and test.
> A: Also, QA tested the same flow and found another issue. The error message is wrong when the account is locked.
> B: That's a different ticket. I'll pick it up next sprint.
> A: They said it's a blocker.
> B: It's a string change. It can wait.
