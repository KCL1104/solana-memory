# Contributing to AgentMemory

First off, thank you for considering contributing to AgentMemory! It's people like you that make AgentMemory such a great tool for the AI agent ecosystem.

## Code of Conduct

This project and everyone participating in it is governed by our commitment to:
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Prioritize user privacy and security

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include code samples or transaction signatures if applicable**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` for your changes
3. Make your changes
4. Run tests and ensure they pass
5. Update documentation if needed
6. Submit a pull request

## Development Setup

### Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (v18 or later)

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/agent-memory.git
cd agent-memory

# Install dependencies
cd app && npm install && cd ..

# Build the program
cd programs/agent_memory
anchor build
cd ../..

# Run tests
anchor test

# Start the frontend
cd app
npm run dev
```

## Style Guidelines

### Rust (Smart Contracts)

- Follow the [Rust Style Guide](https://doc.rust-lang.org/style-guide/)
- Use `cargo fmt` to format your code
- Use `cargo clippy` to catch common mistakes
- Document all public functions with doc comments
- Add tests for new functionality

### TypeScript/JavaScript (Frontend)

- Follow the project's ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Write unit tests for new components

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add batch memory creation functionality

- Implements batch_create_memories instruction
- Adds validation for batch size limits
- Updates documentation

Fixes #123
```

## Testing

### Smart Contract Tests

```bash
anchor test
```

### Frontend Tests

```bash
cd app
npm test
```

## Security

Security is critical for blockchain applications. Please:

- Never commit private keys or seed phrases
- Report security vulnerabilities privately
- Follow best practices for Solana development
- Consider edge cases in your implementations

## Documentation

- Update the README.md if you change functionality
- Update API.md for any API changes
- Add inline documentation for complex code
- Update DEPLOY.md if deployment steps change

## Community

- Join our discussions on GitHub
- Follow us on Twitter for updates
- Share your projects built with AgentMemory!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Security Best Practices

When contributing to AgentMemory, please follow these Solana smart contract security best practices:

### Account Validation
- Use typed accounts (`Account<'info, T>`) for automatic ownership and discriminator validation
- Use `has_one` constraints for ownership relationships
- Validate PDA seeds and bumps explicitly
- Never use `init_if_needed` (reinitialization risk)
- Avoid `AccountInfo` without proper validation

### PDA Best Practices
- Use canonical, deterministic seeds
- Include user-specific identifiers to prevent PDA sharing vulnerabilities
- Store bumps in accounts and validate them

### Error Handling
- Use custom error codes with descriptive messages
- Use `require!` macro for input validation
- Use checked arithmetic (`checked_add`, `saturating_sub`) to prevent overflow
- Fail closed - be overly restrictive rather than allow exploits

### Event Emission
- Emit events for all state changes
- Include relevant metadata for indexing and audit trails

### Anti-Patterns to Avoid
- ❌ `init_if_needed` - Use separate create/update instructions
- ❌ Unchecked arithmetic - Use checked operations
- ❌ Missing signer checks - Always use `Signer<'info>`
- ❌ Missing owner checks - Use typed accounts
- ❌ Shared PDAs without user identifiers
- ❌ Type cosplay - Use discriminators
- ❌ Duplicate mutable accounts - Add explicit checks
- ❌ Arbitrary CPI - Use `Program<'info, T>`
- ❌ Missing events - Emit for all state changes
- ❌ Unsafe account closure - Use `close` constraint

### Security Checklist
Before submitting PRs:
- [ ] All accounts use typed validation
- [ ] PDA seeds are canonical and unique
- [ ] Signer requirements are explicit
- [ ] No `init_if_needed` usage
- [ ] All arithmetic uses checked operations
- [ ] Events emitted for state changes
- [ ] Comprehensive error handling
- [ ] Tests cover both success and failure cases

For more details, see the [Anchor Security Guide](https://www.anchor-lang.com/docs) and [Helius Solana Security Guide](https://www.helius.dev/blog/a-hitchhikers-guide-to-solana-program-security).

---

## Questions?

Feel free to open an issue for any questions about contributing!
