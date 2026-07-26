> A: Let's go through the test cases for the checkout flow. QA, what do we have?
>
> B: I wrote 15 test cases. Covers happy path, error states, and edge cases.
> C: Can you run through the edge cases?
> B: Sure. Empty cart, expired card, wrong CVV, network timeout, and payment declined.
> C: What about partial payment? Like when someone uses a gift card and a credit card?
> B: I didn't think of that. Good catch.
>
> C: Also, what about the loading state? When the payment is processing and the user refreshes the page?
> B: That's an edge case. I can add it but it's pretty rare.
> C: Rare doesn't mean it won't happen. If it happens, the user gets charged twice.
> B: Fine. I'll add it.
>
> A: How about automated tests? Are we covering this in CI?
> C: We have unit tests for the logic. E2E tests are manual for now.
> A: Why not automate the E2E?
> C: Because our E2E setup is flaky. Tests pass locally but fail on CI.
> B: Yeah, I've noticed that. Half my test runs fail because of environment issues, not code issues.
> A: Let's fix the test environment first, then automate.
>
> B: One thing — I found a bug in the price calculation. When there's a discount code, the tax is calculated on the wrong amount.
> C: That's not a bug. That's how the business logic works. The discount is applied after tax.
> B: But the user sees the total before discount and then the final amount is different.
> C: That's what PM asked for. If you think it's wrong, talk to the PM.
> B: I'll bring it up in the next refinement.
>
> A: How long will manual testing take?
> B: About two days, if nothing goes wrong.
> A: We're releasing Friday. That gives you Wednesday and Thursday.
> B: That's tight. What if I find issues?
> A: Then we push the release.
> B: OK. Let me prioritize the critical path tests first.
>
> A: We also need to test on mobile.
> B: I don't have a test device. Can I use the emulator?
> C: The emulator doesn't behave the same as a real device. Let me lend you my test phone.
> B: Thanks.
>
> A: Alright. QA will focus on critical path first, then edge cases. Let's fix the test environment. Anything else?
> B: Can AI help generate some of the test data? Setting up all these scenarios manually takes forever.
> C: I can ask AI to generate mock data. But you'll need to verify it.
> B: Fine by me.
