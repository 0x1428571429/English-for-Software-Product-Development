> A: Hey, can I check the user endpoint? The response looks wrong.
> B: What's wrong with it?
> A: The user object has a field called display_name, but it's always null.
> B: Oh, that field is deprecated. We use full_name now.
> A: When did you change that?
> B: Last week. It's in the updated doc.
> A: The doc still shows display_name.
> B: I updated it yesterday. Maybe you're looking at the old version.
> A: Let me check... no, it still says display_name.
> B: You're right. I forgot to push the changes. Let me update it now.
>
> A: Also, the pagination is broken. When I pass page=2, I get the same results as page=1.
> B: Let me check... works on my end. What parameters are you sending?
> A: page=2&limit=10.
> B: Are you sure you're using GET?
> A: Yes.
> B: Let me see your request. Can you share the network tab?
> A: Here's the screenshot. (paste)
> B: I see the issue. You're sending page as a number, but the API expects a string.
> A: Seriously? That's the issue?
> B: Yeah. It's a legacy thing. We should fix it but it's not high priority.
> A: Can you at least add type coercion on your end?
> B: I'll add it.
>
> A: One more thing — the response time is really slow. It takes 8 seconds for a simple query.
> B: The database is under load. We're adding indexes next week.
> A: Can we at least get a 1-second timeout on the frontend? 8 seconds is too long for users.
> B: That's a frontend decision. Do what you need.
