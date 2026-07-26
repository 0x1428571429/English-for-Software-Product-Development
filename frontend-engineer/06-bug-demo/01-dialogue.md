> A: Hey, I need to show you a bug I found in production.
> 
> B: What's the issue?
> A: When a user adds an item to the cart and then removes it, the total still shows the old amount. You have to refresh the page to see the correct total.
> B: Can you repro it on staging?
> A: It only happens in production. I can't reproduce it locally or on staging.
> B: That's weird. Can you record it?
> A: Yeah, let me record my screen and show you.
> 
> A: (showing recording) See? I add this item, total shows $50. I remove it, total still shows $50. Refresh, it's $0.
> B: Does it happen every time?
> A: No. About 60% of the time. I can't figure out the pattern.
> B: That's going to be hard to debug.
> 
> A: This affects all users who use the cart. It's a pretty big deal.
> B: How many users have reported it?
> A: Three so far. But it's probably more — most users just refresh and move on.
> A: I'd argue this is urgent. It's a data integrity issue. Users might think they're being overcharged.
> B: I agree. Let me check if this is frontend or backend. Can you show me the network tab?
> A: Sure. The API call returns the correct data. The frontend just isn't updating the UI.
> B: So it's a frontend issue. Good to know.
> 
> B: I've seen this before. It's probably a stale state issue. Let me paste the error into AI and see what it says.
> A: I already tried. AI suggested checking the reducer, but I don't think that's the issue.
> B: Let's pair on it after this. Shouldn't take long.
> A: Hope so. I've been on it for two hours.
