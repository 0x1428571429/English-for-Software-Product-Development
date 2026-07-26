> A: Hey, I found a bug in the login flow.
> B: Which one? I fixed a login bug yesterday.
> A: It might be the same one. Can you check?
> B: Let me look. Which ticket is it?
> A: I don't have a ticket yet. I just found it while testing.
> B: Can you send me the steps to reproduce?
> A: Sure. Go to the login page, enter a valid email, wrong password three times, then enter the correct password. It still says "account locked."
> B: Let me try... I can't reproduce it. Does it happen every time?
> A: On staging, yes. Not on local.
> B: Might be a cache issue. Can you clear your cache?
> A: I already did. Still happens.
> B: Let me check the staging config. Maybe it's different from local.
>
> A: Also, I found another issue. When I log in with Google SSO, the name doesn't show up on the profile page.
> B: That's existing behavior. It's not related to my change.
> A: OK. Should I file a separate bug?
> B: Yeah, file it and I'll look at it next sprint. This sprint is full.
>
> A: Can AI help with the first bug?
> B: I already asked AI. It suggested checking the rate limiter config, which was correct. The staging config was wrong.
> A: So it's not a code issue?
> B: Nope. Config issue. I'll fix it.
