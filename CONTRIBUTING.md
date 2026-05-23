# Contributing to ION DEX

Thank you for your interest in contributing! This project is governed by strict quality and security standards.

## License

By contributing, you agree that your contributions will be licensed under GPL v3.0.

## 📋 Requirements

- All code must pass CI: `forge test` (contracts), `tsc --noEmit` (frontend), `tsc` (backend)
- Solidity: 1000-pass security test suite required before merge
- No mock/placeholder/test data in production code
- All external dependencies must be audited

## 🔄 Process

1. **Fork** the repository
2. **Create a branch**: `feature/description` or `fix/description`
3. **Commit** with clear messages referencing the issue/spec
4. **Open a Pull Request** against `main`
5. **Code review** required — at least one core maintainer must approve
6. **CI must pass** before merge

## 🛡️ Security

- Smart contract changes require a security review
- Oracle integrations must include staleness checks
- External calls must use reentrancy guards
- Report vulnerabilities via the security policy (see SECURITY.md)

## 📝 Style

- Solidity: follow existing patterns, use SafeMath, avoid state toggles
- TypeScript: strict mode, no `any`, prefer interfaces over types
- UI: reference `react-bits` component library

## 📄 Module Ownership

See `.github/CODEOWNERS` for module-level review responsibilities.
