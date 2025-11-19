# Documentation Templates

This directory contains templates and guidelines for creating new documentation files.

---

## 📚 Available Templates

### **[apis.md](apis.md)**
Template for documenting API endpoints.

**Use when:**
- Creating new API endpoint documentation
- Documenting groups of related endpoints
- Need consistent API documentation structure

**Key sections:**
- Endpoint title and method
- Purpose and description
- Authentication requirements
- Parameters (query, path, headers)
- Request body structure
- Response codes and structures
- File path reference

---

### **[app-flows.md](app-flows.md)**
Template for documenting application flows.

**Use when:**
- Documenting user journeys
- Creating flow diagrams
- Explaining multi-step processes

**Key sections:**
- Flow name and purpose
- Implementation guidelines
- Mermaid diagram
- Step-by-step breakdown
- Notes and adaptations

---

### **[database-schema.md](database-schema.md)**
Template for documenting database schema.

**Use when:**
- Documenting database tables
- Creating schema documentation
- Explaining relationships and constraints

**Key sections:**
- Table structure
- Column definitions
- Relationships
- Indexes and constraints
- RLS policies (if applicable)
- Functions and triggers

---

### **[memory-entries.md](memory-entries.md)**
Template for documenting errors and solutions.

**Use when:**
- Documenting resolved errors
- Creating knowledge base of mistakes
- Preventing error repetition

**Key sections:**
- Problem description
- Wrong approach
- Correct solution
- Root cause
- Prevention tips

---

## 📝 How to Use These Templates

1. **Copy the template** to the appropriate location:
   - APIs → `md/docs/apis/` (if you create this folder)
   - Flows → `md/docs/app-flows/`
   - Schema → `md/docs/database-schema/` (if you create this folder)
   - Errors → `md/docs/mistakes/` (if you create this folder)

2. **Follow the structure** defined in the template

3. **Replace placeholders** with your actual content

4. **Keep files under 250 lines** for readability

5. **Use descriptive filenames** in kebab-case

---

## 🎯 Documentation Standards

### File Naming
- Use kebab-case: `feature-name.md`
- Be descriptive: `user-authentication-flow.md` not `auth.md`
- Group related content: `events-crud.md` for all event CRUD operations

### Structure
- Start with clear title and purpose
- Include table of contents for long documents
- Use code blocks with language specification
- Add diagrams where helpful (Mermaid preferred)
- Link to related documentation

### Maintenance
- Update documentation when code changes
- Archive outdated documentation instead of deleting
- Keep examples current and tested
- Review documentation quarterly

---

## 📁 Current Documentation Structure

For reference, here's the current documentation organization:

```
md/docs/
├── README.md                           # Documentation index
├── architecture.md                     # System architecture
├── tech-stack.md                       # Technology stack
├── design-guidelines.md                # UI/UX guidelines
│
├── app-flows/                          # Application flows
│   ├── README.md
│   ├── booking-flow.md
│   ├── onboarding-flow.md
│   ├── vehicle-registration-flow.md
│   └── garage-registration-flow.md
│
├── geocoding-service.md                # Geocoding service
├── database-seeding-quick-reference.md # Database seeding
├── SEED_DATA_CREDENTIALS.md            # Test credentials
│
├── templates/                          # This folder
│   ├── README.md
│   ├── apis.md
│   ├── app-flows.md
│   ├── database-schema.md
│   └── memory-entries.md
│
└── archive/                            # Historical documentation
    ├── implementation-history/
    ├── planning-history/
    └── prd-initial-planning/
```

---

## 🔗 Related Documentation

- **Main README:** [../../README.md](../../README.md)
- **Documentation Index:** [../README.md](../README.md)
- **Design Guidelines:** [../design-guidelines.md](../design-guidelines.md)

---

**These templates help maintain consistent, high-quality documentation across the project.**

