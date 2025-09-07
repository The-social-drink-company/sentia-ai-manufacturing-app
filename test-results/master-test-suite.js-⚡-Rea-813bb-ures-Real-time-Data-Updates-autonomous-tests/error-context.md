# Page snapshot

```yaml
- generic [ref=e5]:
  - heading "Sign in to your account" [level=2] [ref=e7]
  - button "Sign in with Microsoft" [ref=e9] [cursor=pointer]:
    - img [ref=e10] [cursor=pointer]
    - text: Sign in with Microsoft
  - generic [ref=e20]: Or continue with email
  - generic [ref=e21]:
    - generic [ref=e22]:
      - generic [ref=e23]: Email address
      - textbox "Email address" [ref=e24]
    - generic [ref=e25]:
      - generic [ref=e26]: Password
      - textbox "Password" [ref=e27]
    - button "Sign In" [ref=e29] [cursor=pointer]
  - link "Don't have an account? Sign up" [ref=e31] [cursor=pointer]:
    - /url: /auth/signup
```