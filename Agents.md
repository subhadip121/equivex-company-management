
## 1. Feature Implementation & API Verification Workflow

- **Test Before Implementing:** Whenever implementing functionality that relies on an API or backend endpoint, ALWAYS test the endpoint first.
- **Inspect Response Structure:** Execute the request and verify the real-time response body, status codes, data types, and nested property structures.
- **Implement Based on Verified Specs:** Build and refine all client/server logic based solely on the actual, observed API response—never assume or guess data shapes.

## UI & Styling Guidelines

- **Design System Homogeneity:** Always maintain strict visual and structural consistency with existing components.
- **No Duplicate / Redundant CSS:** Do NOT create new CSS classes, custom styles, or inline styles if an existing style, utility class (e.g., Tailwind), or component already exists.
- **Design Tokens:** Strictly reuse existing design tokens/variables for spacing, colors, typography, borders, and shadows instead of hardcoding arbitrary values.

## Tool Usage & Inspection Rules

- **Single-Pass File Reading:** When inspecting a file under 500 lines, read the entire file in a single tool call (`view_file`). Do not split reading into multiple offset chunks.
- **No Incremental Windowing:** Do not make multiple sequential `get-content` calls on the same file. Read it entirely into memory before planning edits.