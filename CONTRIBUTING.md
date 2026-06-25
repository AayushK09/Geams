# Contributing to GEAMS

Thank you for considering contributing to GEAMS! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful and professional in all interactions. We're committed to providing a welcoming and inclusive environment.

## How to Contribute

### Reporting Bugs

Before opening an issue, please:

1. Search existing issues to avoid duplicates
2. Check the documentation and FAQ
3. Include:
   - OS and version
   - Node.js version
   - Steps to reproduce
   - Expected vs actual behavior
   - Logs/error messages

**Issue Template:**

```
**Description:**
[Clear description of the bug]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Environment:**
- OS:
- Node.js:
- GEAMS Version:

**Logs:**
[Error messages or logs]
```

### Suggesting Features

1. Search existing issues/discussions first
2. Provide a clear use case
3. Explain why it would be useful
4. Include examples if possible

**Feature Template:**

```
**Description:**
[Clear description]

**Use Case:**
[Why is this needed?]

**Proposed Solution:**
[How would this work?]

**Alternatives:**
[Other approaches considered]
```

### Submitting Code

#### Prerequisites

- Fork the repository
- Clone your fork
- Create a feature branch: `git checkout -b feature/your-feature-name`
- Install dependencies: `npm install`

#### Development Workflow

1. **Make your changes:**
   - Follow the existing code style
   - Write clear, descriptive commit messages
   - Keep commits focused and logical
   - Add comments for complex logic

2. **Test your changes:**

   ```bash
   # Frontend
   cd frontend && npm run lint

   # Backend
   cd backend && npm run lint && npm run test
   ```

3. **Format code:**

   ```bash
   npm run format
   ```

4. **Write tests (if applicable):**
   - Add unit tests for new features
   - Update tests if modifying existing features
   - Maintain test coverage >80%

#### Commit Message Guidelines

Follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding tests
- `chore:` Build/dependency updates

**Examples:**

```
feat(mediasoup): add support for H264 codec

fix(websocket): resolve transport connection timeout

docs(deployment): add VPS setup instructions

refactor(frontend): simplify VideoGrid component

perf(backend): optimize database queries
```

#### Pull Request Process

1. **Update main branch:**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request:**
   - Reference related issues
   - Describe what you changed and why
   - Include screenshots for UI changes
   - List any breaking changes

4. **PR Template:**

   ```
   ## Description
   [Clear description of changes]

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Related Issues
   Fixes #[issue number]

   ## Testing
   [How to test these changes]

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Comments added for complex logic
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

## Code Style Guidelines

### General

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings (except JSX attributes)
- Max line length: 100 characters
- Use descriptive variable names

### TypeScript

- Explicit return types for functions
- Avoid `any` type (use `unknown` if needed)
- Use interfaces over types for object shapes
- Define types in separate `.d.ts` files

### React/Frontend

- Functional components with hooks
- Use custom hooks for logic reuse
- Props validation with TypeScript
- Separate concerns into smaller components

### NestJS/Backend

- Organize code by feature modules
- Use dependency injection
- Error handling with exceptions
- Comprehensive logging
- Input validation with class-validator

## Documentation

Help improve documentation by:

- Fixing typos/grammar
- Clarifying confusing sections
- Adding examples
- Keeping docs up-to-date

Documentation guidelines:

- Use Markdown format
- Include code examples
- Link to related docs
- Keep it beginner-friendly

## Testing

### Frontend Tests

```bash
cd frontend
npm run test
```

### Backend Tests

```bash
cd backend
npm run test
```

### Integration Tests

```bash
npm run test:e2e
```

Test requirements:

- Minimum 80% coverage
- Test happy path and edge cases
- Mock external dependencies
- Use descriptive test names

## Performance Considerations

- Monitor bundle size
- Optimize images and assets
- Avoid unnecessary re-renders
- Use lazy loading
- Profile and benchmark changes
- Document performance implications

## Security

- Never commit secrets or API keys
- Validate all inputs
- Sanitize user data
- Use HTTPS for communication
- Keep dependencies updated
- Report security issues privately

## Getting Help

- Check documentation in `/docs`
- Review existing code and comments
- Ask in discussions/issues
- Review design document
- Check NestJS/Next.js docs

## Review Process

Your PR will be reviewed for:

- Code quality
- Tests coverage
- Performance
- Security
- Documentation
- Adherence to guidelines

Reviewers may request changes. Please:

- Read feedback carefully
- Ask for clarification if needed
- Make requested changes
- Push updated code
- Request re-review

## Licensing

By contributing, you agree your code will be licensed under MIT License.

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page

Thank you for contributing to GEAMS! 🎉
