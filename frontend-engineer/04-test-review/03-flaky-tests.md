## "Our E2E setup is flaky. Tests pass locally but fail on CI."

自动化测试不稳定，没人信。

还可以说：
- The tests are flaky
- They pass on my machine but not on CI
- We have a lot of false negatives
- The test environment is unreliable

### 关联对话

> B: Half my test runs fail because of environment issues, not code issues.
> A: Let's fix the test environment first, then automate.

- Let's fix the test environment first
- We need stable tests before we can trust them
- False negatives are worse than no tests
- People start ignoring test failures

### QA 说"这个不是bug"

> C: That's not a bug. That's how the business logic works.

- That's not a bug, that's how it works
- That's the expected behavior
- That's what PM asked for
- If you think it's wrong, talk to the PM

### 测试设备问题

> B: I don't have a test device. Can I use the emulator?
> C: The emulator doesn't behave the same as a real device.

- I don't have a test device — 没测试设备
- Can I use the emulator? — 能用模拟器吗？
- The emulator doesn't behave the same — 模拟器和真机不一样

### 什么时候说

- 自动化测试不稳定时
- QA 发现"bug"其实是预期行为时
- 测试设备不够时
