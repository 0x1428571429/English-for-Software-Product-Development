> (Phone rings at 2 AM)
> A: Hello?
> B: Hey, sorry to wake you. Production is down. Users can't log in.
> A: What? Let me check. I'm logging into the VPN now.
> B: We started getting alerts about 10 minutes ago. 503 errors across all services.
> A: Did we deploy something today?
> B: Yeah, we pushed a hotfix for the search feature this afternoon.
> A: That's probably it. Let me look at the logs.
>
> A: I see it. The hotfix has a memory leak. It's consuming all the server resources.
> B: Can we roll back?
> A: Let me do that now. Rolling back to the previous version.
> B: How long will it take?
> A: A few minutes. Let me monitor the recovery.
>
> (10 minutes later)
> A: OK, services are back up. Users can log in again.
> B: Great. Do we know what caused the memory leak?
> A: Not yet. I'll investigate tomorrow. For now, let the rollback hold.
> B: Should we send a postmortem?
> A: Yes. Let me write it up tomorrow. We need a root cause analysis.
>
> (Next morning)
> A: I found the root cause. It was a missing cleanup in the hotfix code. AI suggested the fix, and I didn't review it carefully enough.
> B: So AI's hotfix broke production?
> A: Yeah. We need to be more careful with AI-generated code in hotfixes.
> B: Let's add that to the postmortem.
> A: Already did. Also, we should add monitoring for memory usage.
> B: We said that last time too.
> A: I know. But this time let's actually do it.
