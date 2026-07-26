> A: Hey, can you check the payment endpoint? I'm getting a 500.
> B: Let me look... yeah, there's an error. What payload are you sending?
> A: The one from your doc. But the doc doesn't match what the server expects.
> B: The doc is outdated. We changed the field names last week.
> A: You didn't tell me.
> B: I thought I updated the doc. Sorry.
>
> A: So what's the correct format now?
> B: amount should be amount_cents. currency_code should be currency.
> A: OK. Let me update it. But this is why my integration is two days delayed.
> B: I know. My bad.
>
> A: Also, the response is taking forever. It times out after 30 seconds.
> B: Some queries are slow. We're working on it.
> A: Can we at least get a faster timeout? 30 seconds is too long.
> B: I'll check with the team.
>
> A: And CORS. I can't call your API from the frontend in development.
> B: What's the CORS error?
> A: No 'Access-Control-Allow-Origin' header. Can you add localhost to the whitelist?
> B: I'll add it. Ping me if it still doesn't work.
>
> A: One more thing — your mock server returns different data than the real API.
> B: Really? What's different?
> A: The mock returns camelCase. The real API returns snake_case.
> B: Oh. The mock was written by someone else. I'll fix it.
> A: I spent an hour debugging that.
> B: Sorry. I'll make sure the mock matches prod.
>
> A: Let me test again after you make these changes.
> B: Sure. I'll ping you when the fixes are deployed.
> A: Can we pair on this? I want to make sure it works end to end.
> B: Yeah, let's pair this afternoon.
