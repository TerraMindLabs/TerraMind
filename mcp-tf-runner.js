const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { exec } = require("child_process");
const util = require("util");
const fs = require("fs/promises");
const path = require("path");

const execPromise = util.promisify(exec);


const server = new Server(
  { name: "tf-runner", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "terraform_validate",
        description: "Runs 'terraform init' and 'terraform validate' on the workspace to ensure the code is syntactically correct.",
        inputSchema: { 
          type: "object", 
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files (e.g., E:\\TerraformProject\\project-name)" }
          },
          required: ["project_path"]
        },
      },
      {
        name: "terraform_fmt",
        description: "Runs 'terraform fmt' to format the Terraform code according to standard conventions.",
        inputSchema: { 
          type: "object", 
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files" }
          },
          required: ["project_path"]
        },
      },
      {
        name: "terraform_scan",
        description: "Runs 'tfsec' (or Trivy) on the workspace to find security vulnerabilities.",
        inputSchema: { 
          type: "object", 
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files" }
          },
          required: ["project_path"]
        },
      },
      {
        name: "terraform_generate_backend",
        description: "Generates a backend.tf file for the specified backend type.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files" },
            backend_type: { type: "string", description: "The type of backend (e.g., s3, gcs, azurerm, local)" }
          },
          required: ["project_path", "backend_type"]
        }
      },
      {
        name: "terraform_generate_provider",
        description: "Generates a provider.tf file for the specified cloud provider.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files" },
            provider_name: { type: "string", description: "The name of the provider (e.g., aws, google, azurerm)" }
          },
          required: ["project_path", "provider_name"]
        }
      },
      {
        name: "terraform_generate_tfvars",
        description: "Generates a terraform.tfvars template file with placeholders for sensitive data.",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string", description: "The absolute path to the directory containing the .tf files" },
            variables: { type: "array", items: { type: "string" }, description: "List of variable names to include in the tfvars file" }
          },
          required: ["project_path", "variables"]
        }
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments;
  if (!args || !args.project_path) {
    return { isError: true, content: [{ type: "text", text: "Error: project_path argument is required" }] };
  }
  const targetDir = args.project_path;

  if (request.params.name === "terraform_validate") {
    try {
      const envArgs = { ...process.env, TF_PLUGIN_CACHE_DIR: "C:\\TerraformProject\\.terraform.d\\plugin-cache" };
      const { stdout: initOut } = await execPromise("terraform init -backend=false", { cwd: targetDir, env: envArgs });
      const { stdout: valOut, stderr: valErr } = await execPromise("terraform validate", { cwd: targetDir });
      return { content: [{ type: "text", text: `Init:\n${initOut}\nValidate:\n${valOut}\n${valErr}` }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Error: ${error.message}\n${error.stdout}\n${error.stderr}` }] };
    }
  }

  if (request.params.name === "terraform_fmt") {
    try {
      const { stdout, stderr } = await execPromise("terraform fmt", { cwd: targetDir });
      return { content: [{ type: "text", text: `Format Output:\n${stdout}\n${stderr}` }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Error: ${error.message}\n${error.stdout}\n${error.stderr}` }] };
    }
  }

  if (request.params.name === "terraform_scan") {
    try {
      const { stdout, stderr } = await execPromise("E:\\LibreChat\\tfsec.exe .", { cwd: targetDir });
      return { content: [{ type: "text", text: `Scan Output:\n${stdout}\n${stderr}` }] };
    } catch (error) {
      // tfsec returns non-zero exit code if vulnerabilities are found
      return { content: [{ type: "text", text: `Scan Findings:\n${error.stdout}\n${error.stderr}` }] };
    }
  }

  if (request.params.name === "terraform_generate_backend") {
    try {
      const type = args.backend_type;
      let content = "";
      if (type === "s3") {
        content = `terraform {\n  backend "s3" {\n    bucket         = "my-terraform-state"\n    key            = "workspace/terraform.tfstate"\n    region         = "us-east-1"\n    encrypt        = true\n    dynamodb_table = "terraform-lock"\n  }\n}\n`;
      } else if (type === "gcs") {
        content = `terraform {\n  backend "gcs" {\n    bucket  = "my-terraform-state"\n    prefix  = "terraform/state"\n  }\n}\n`;
      } else if (type === "azurerm") {
        content = `terraform {\n  backend "azurerm" {\n    resource_group_name  = "tfstate"\n    storage_account_name = "tfstate"\n    container_name       = "tfstate"\n    key                  = "terraform.tfstate"\n  }\n}\n`;
      } else {
        content = `terraform {\n  backend "local" {\n    path = "terraform.tfstate"\n  }\n}\n`;
      }
      await fs.writeFile(path.join(targetDir, "backend.tf"), content);
      return { content: [{ type: "text", text: `Successfully generated backend.tf for ${type}` }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Error generating backend.tf: ${error.message}` }] };
    }
  }

  if (request.params.name === "terraform_generate_provider") {
    try {
      const provider = args.provider_name;
      let content = "";
      if (provider === "aws") {
        content = `provider "aws" {\n  region = "us-east-1"\n}\n`;
      } else if (provider === "google") {
        content = `provider "google" {\n  project = "my-gcp-project"\n  region  = "us-central1"\n}\n`;
      } else if (provider === "azurerm") {
        content = `provider "azurerm" {\n  features {}\n}\n`;
      } else {
        content = `provider "${provider}" {\n  # Configuration options\n}\n`;
      }
      await fs.writeFile(path.join(targetDir, "provider.tf"), content);
      return { content: [{ type: "text", text: `Successfully generated provider.tf for ${provider}` }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Error generating provider.tf: ${error.message}` }] };
    }
  }

  if (request.params.name === "terraform_generate_tfvars") {
    try {
      const vars = args.variables;
      let content = "# Auto-generated terraform.tfvars template\n# Please fill in the sensitive values below\n\n";
      for (const v of vars) {
        content += `${v} = "placeholder_value"\n`;
      }
      await fs.writeFile(path.join(targetDir, "terraform.tfvars"), content);
      return { content: [{ type: "text", text: `Successfully generated terraform.tfvars with placeholders` }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: `Error generating terraform.tfvars: ${error.message}` }] };
    }
  }

  throw new Error("Tool not found");
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TF Runner MCP Server started on stdio");
}

run().catch(console.error);
