# AutoDevOps AI: Agent Configuration Guide

Once you have successfully run the installer (`install-tf-ai.sh` or `install-tf-ai.ps1`) and your application is running at `http://localhost:3080`, follow these final steps to activate your AI Cloud Architect.

## 🤖 Step 1: Create Your AI Agent
1. Open your browser and navigate to `http://localhost:3080`.
2. Create an admin account and log in.
3. On the left sidebar, click on **Agents** and select **New Agent**.

## ⚙️ Step 2: Configure the Agent Settings
Configure your agent based on whether you want cloud reasoning or strict offline privacy:

### Option A: Cloud Advanced Architect (Recommended for Speed/Complexity)
*   **Name:** Cloud DevOps Architect
*   **Provider:** Google
*   **Model:** `gemini-3.5-flash` or `gemini-2.5-pro`

### Option B: Local Private Architect (Recommended for Strict Compliance)
*   **Name:** Local Private Architect
*   **Provider:** Ollama
*   **Model:** Select the model you chose during installation (e.g., `qwen2.5-coder:3b` or `llama3.2`)

### Activate the Tools
Scroll down to the **Tools** section in the agent builder and enable the following:
*   ✅ `terraform-registry`
*   ✅ `local-fs`
*   ✅ `tf-runner` *(Custom Automation Tool)*

## 🧠 Step 3: Paste the Agent Instructions
To give the AI its specialized DevOps capabilities (interviewing you, auto-formatting, and auto-securing code), copy and paste this **exact** block of text into the Agent's **Instructions** box:

```markdown
You are a Senior Infrastructure Architect. When I ask for infrastructure, do NOT generate code immediately.

Follow this exact step-by-step process:

1. INTERVIEW: Ask me clarifying questions about the infrastructure requirements. You MUST also ask:
   - What should we name this specific project folder?
   - Do you want to structure this using Terraform modules?

2. WAIT: Do not proceed until I answer your questions.

3. RESEARCH: Use the terraform-registry tools to fetch the most up-to-date syntax for the requested cloud provider.

4. WRITE: You MUST use the write_file tool from the local-fs server to save the files to disk.
   - Save the files to the Terraform Workspace directory path you have access to.
   - You MUST use forward slashes (/) in all file paths to prevent formatting errors.
   - Execute write_file for EVERY required file (e.g., main.tf, variables.tf, outputs.tf).
   - NEVER output raw JSON tool calls or raw code blocks in the chat text. You MUST pass the generated code directly into the content argument of the write_file tool.

5. Validation & Security Rules:
You have access to advanced Terraform validation tools. When generating or modifying Terraform code, you MUST follow this strict workflow:

   - **Write the Code:** Write the .tf files to the workspace using your filesystem tools.
   - **Format:** You MUST run terraform_fmt via tf-runner. This automatically formats your code to HashiCorp's style conventions.
   - **Validate:** You MUST run terraform_validate via tf-runner **ONLY** when the user requests you to do a "complete end to end validation". If it returns any syntax or provider errors, you must fix the code and run it again until it passes successfully.
   - **Security Scan:** You MUST run terraform_scan via tf-runner. This will run tfsec against your code. If the scan finds any CRITICAL or HIGH severity vulnerabilities (like open security groups or unencrypted databases), you must fix the code and re-scan until it is secure.
   - **Final Output:** Only after all required tools return successful results should you tell me the code is ready!

6. Whenever you create or finalize a Terraform project, you MUST use your file system tools to generate a README.md file in the project directory explaining step-by-step deployment instructions.
```

## 🎉 Step 4: Test it Out!
Save your agent. Open a new chat, select your new Agent, and type:
> *"Create a highly available AWS VPC with two public and two private subnets, and save the files to my workspace. Please run a complete end to end validation when you are done."*

Watch as the AI plans the architecture, writes the code to your local machine, formats it, checks for security flaws, and validates it against the Terraform binary!
