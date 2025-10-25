# Contributing to GCOS

Contributing to **GCOS (Gemini API Comprehensive Operations Suite)**.

---

## Quick Start

### 1. Fork and Clone
```bash
git clone https://github.com/YOUR-USERNAME/gcos.git
cd gcos
git remote add upstream https://github.com/ORIGINAL-OWNER/gcos.git
```

### 2. Setup Environment
```bash
npm install
cp environments/.env.example .env
nano .env  # Add your GEMINI_API_KEY
```

### 3. Verify Setup
```bash
npm run validate
npm run test
```

---

## Development Workflow

### 1. Create Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

**Branch prefixes**: `feature/`, `fix/`, `docs/`, `test/`, `refactor/`

### 2. Make Changes
- **Collections**: Edit JSON files in `collections/`
- **Scripts**: Edit files in `scripts/`
- **Documentation**: Edit Markdown files in `docs/`

### 3. Test Changes
```bash
npm run validate
npm run test
npm audit
```

### 4. Commit
```bash
git commit -m "feat: add vision analysis endpoints

- Add OCR capability
- Include test scripts
- Update documentation

Closes #123"
```

**Commit types**: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`

### 5. Submit PR
```bash
git push origin feature/your-feature-name
```
Create PR on GitHub with description, testing details, and related issues.

---

## Collection Guidelines

### Structure
- Use hierarchical folders for organization
- Include pre-request and test scripts
- Use environment variables: `{{VARIABLE_NAME}}`
- Never hardcode API keys

### Test Script Example
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains candidates", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.candidates).to.be.an('array').that.is.not.empty;
});
```

---

## Testing Standards

- **Unit**: Test individual requests
- **Integration**: Test complete workflows
- **Performance**: Validate response times < 5s
- **Security**: Verify no API key exposure

---

## Security Guidelines

```bash
# NEVER commit API keys
# Use environment variables
echo "GEMINI_API_KEY=your_key" > .env
```

- Never commit credentials
- Use `.env` files (in `.gitignore`)
- Test with appropriate content only
- Report vulnerabilities privately

---

## Code Review Checklist

- [ ] All tests pass locally
- [ ] Collections validate with `newman`
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No hardcoded credentials

---

## Bug Reporting

```markdown
**Environment**: Postman v10.18.0, macOS 13.5
**Steps**: 1. Import collection 2. Set API key 3. Run request
**Expected**: 200 status with generated text
**Actual**: 400 Bad Request error
```

**Labels**: `bug`, `critical`, `minor`, `security`, `documentation`, `enhancement`

---

## Recognition

Contributors recognized in:
- GitHub contributors page
- `CONTRIBUTORS.md` file
- Release notes
- Project README


---

## Getting Help

- **GitHub Discussions**: Questions and ideas
- **Issues**: Bug reports and features
- **Pull Requests**: Code contributions

---

## License

By contributing, I agree My contributions are licensed under **Apache License 2.0**.

---

**Thank you for helping improve GCOS!**

**Curated by Abushan** | [GitHub: abushanisro](https://github.com/abushanisro) | [LinkedIn: abushan](https://linkedin.com/in/abushan)