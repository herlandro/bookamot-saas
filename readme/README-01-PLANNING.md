# Planning Roadmap

## 1 - Write a briefing marketing description (2 paragraphs)

• Agent: Agent (Standard)
• LLM: claude-4-sonnet MAX
• Prompt: [briefing marketing description]
• Result: briefing-marketing.mdc

## 2 - briefing-marketing.mdc (agent)

• Agent: prd.md
• LLM: claude-4-sonnet MAX
• Rules: breafing-marketing.mdc
• Prompt: briefing | marketing text @briefing-marketing.mdc | The technology stack is in the attached project.mdc. Please read it. Also add tailwind.css
• Result: prd.mdc

## 3 - prd.mdc (agent)

• Rules: prd.md, project.md, app-flow.md
• Agent: prd.md
• Prompt: Use @prd to feed the @project.mdc and @app-flow.mdc rules
• Result: project.mdc

## 4 - project.mdc (agent)

• Rules: app-flow.mdc
• Agent: Agent
• Prompt: @app-flow create a Mermeid diagram to illustrate the app's UX flow
• Result: app-flow.mdc

## 5 - app-flow (mermeid diagram)

• Rules: prd.md, database.xhema, project.md, memory.md, apis.md
• Agent: Standard
• Prompt: Read @memery.mdc carefully to learn how you will change @apis.mdc. Insert it replacing where it says "enter apis here". Now use @supabase-shema, @project.mdc, and @prd.md to create a mockup of APIs that I will use in my project. Try to be as straightforward as possible; don't create unnecessary API mockups, as I'm still at the beginning of the project.
• Result: api.mdc | api mockup (mermeid diagram)

## 6 - api.mdc | api mockup (mermeid diagram) 

## 7 - Mock the database schema
• Rules: database-schema.md

## 8 - Mock the API 
• Rules: apis.md

## 9 - Customize (if necessary)
• tech-stack.md
• architecture.md
• dev-workflow.md