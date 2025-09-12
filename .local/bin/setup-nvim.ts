#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Neovim Deno TypeScript IDE Auto-Configuration Script
 *
 * This script automatically sets up a complete Neovim configuration
 * for Deno + TypeScript development with IDE capabilities.
 *
 * Usage: deno run --allow-read --allow-write --allow-run setup-nvim.ts
 */

import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface ConfigFile {
  path: string;
  content: string;
  description: string;
}

class NeovimSetup {
  private configDir: string;
  private backupDir: string;

  constructor() {
    const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
    if (!homeDir) {
      throw new Error("Could not determine home directory");
    }

    this.configDir = join(homeDir, ".config", "nvim");
    this.backupDir = join(homeDir, ".config", "nvim.backup");
  }

  private async checkPrerequisites(): Promise<void> {
    console.log("🔍 Checking prerequisites...");

    // Check for Neovim
    try {
      const nvimProcess = new Deno.Command("nvim", {
        args: ["--version"],
        stdout: "piped",
        stderr: "piped",
      });
      const nvimResult = await nvimProcess.output();
      if (!nvimResult.success) {
        throw new Error("Neovim not found");
      }
      console.log("✅ Neovim found");
    } catch {
      throw new Error("❌ Neovim is not installed or not in PATH");
    }

    // Check for Deno
    try {
      const denoProcess = new Deno.Command("deno", {
        args: ["--version"],
        stdout: "piped",
        stderr: "piped",
      });
      const denoResult = await denoProcess.output();
      if (!denoResult.success) {
        throw new Error("Deno not found");
      }
      console.log("✅ Deno found");
    } catch {
      throw new Error("❌ Deno is not installed or not in PATH");
    }

    // Check for Git
    try {
      const gitProcess = new Deno.Command("git", {
        args: ["--version"],
        stdout: "piped",
        stderr: "piped",
      });
      const gitResult = await gitProcess.output();
      if (!gitResult.success) {
        throw new Error("Git not found");
      }
      console.log("✅ Git found");
    } catch {
      throw new Error("❌ Git is not installed or not in PATH");
    }
  }

  private async backupExistingConfig(): Promise<void> {
    if (await exists(this.configDir)) {
      console.log("📦 Backing up existing Neovim configuration...");

      if (await exists(this.backupDir)) {
        console.log("🗑️  Removing old backup...");
        await Deno.remove(this.backupDir, { recursive: true });
      }

      await Deno.rename(this.configDir, this.backupDir);
      console.log(`✅ Existing configuration backed up to: ${this.backupDir}`);
    }
  }

  private getConfigFiles(): ConfigFile[] {
    return [
      {
        path: "init.lua",
        description: "Main Neovim configuration",
        content: `-- Initialize configuration
require("config.options")
require("config.lazy")
require("config.keymaps")

-- Enable Deno for TypeScript files
vim.g.deno_enable = true

-- Set up autocmds for Deno
local augroup = vim.api.nvim_create_augroup("DenoConfig", { clear = true })
vim.api.nvim_create_autocmd({"BufRead", "BufNewFile"}, {
  group = augroup,
  pattern = {"*.ts", "*.tsx", "*.js", "*.jsx"},
  callback = function()
    -- Check if deno.json or deno.jsonc exists in project root
    local deno_config = vim.fn.findfile("deno.json", ".;")
    local deno_config_c = vim.fn.findfile("deno.jsonc", ".;")

    if deno_config ~= "" or deno_config_c ~= "" then
      vim.b.deno_enable = true
      vim.bo.filetype = "typescript"
    end
  end,
})`
      },
      {
        path: "lua/config/options.lua",
        description: "Neovim options and settings",
        content: `local opt = vim.opt

-- Line numbers
opt.number = true
opt.relativenumber = true

-- Tabs and indentation
opt.tabstop = 2
opt.softtabstop = 2
opt.shiftwidth = 2
opt.expandtab = true
opt.autoindent = true
opt.smartindent = true

-- Line wrapping
opt.wrap = false

-- Search settings
opt.ignorecase = true
opt.smartcase = true
opt.hlsearch = true
opt.incsearch = true

-- Cursor line
opt.cursorline = true

-- Appearance
opt.termguicolors = true
opt.background = "dark"
opt.signcolumn = "yes"
opt.colorcolumn = "100"

-- Backspace
opt.backspace = "indent,eol,start"

-- Clipboard
opt.clipboard:append("unnamedplus")

-- Split windows
opt.splitright = true
opt.splitbelow = true

-- Undo
opt.undofile = true
opt.undodir = vim.fn.expand("~/.config/nvim/undo")

-- Update time (for better UX)
opt.updatetime = 300
opt.timeoutlen = 300

-- File encoding
opt.fileencoding = "utf-8"`
      },
      {
        path: "lua/config/lazy.lua",
        description: "Lazy plugin manager setup",
        content: `local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  spec = {
    { import = "plugins" },
  },
  defaults = {
    lazy = false,
    version = false,
  },
  install = { colorscheme = { "tokyonight" } },
  checker = { enabled = true },
  performance = {
    rtp = {
      disabled_plugins = {
        "gzip",
        "tarPlugin",
        "tohtml",
        "tutor",
        "zipPlugin",
      },
    },
  },
})`
      },
      {
        path: "lua/config/keymaps.lua",
        description: "Key mappings and shortcuts",
        content: `-- Set leader key
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

local keymap = vim.keymap.set

-- General keymaps
keymap('n', '<leader>nh', ':nohl<CR>', { desc = 'Clear search highlights' })

-- Window management
keymap('n', '<leader>sv', '<C-w>v', { desc = 'Split window vertically' })
keymap('n', '<leader>sh', '<C-w>s', { desc = 'Split window horizontally' })
keymap('n', '<leader>se', '<C-w>=', { desc = 'Make splits equal size' })
keymap('n', '<leader>sx', '<cmd>close<CR>', { desc = 'Close current split' })

-- Tab management
keymap('n', '<leader>to', '<cmd>tabnew<CR>', { desc = 'Open new tab' })
keymap('n', '<leader>tx', '<cmd>tabclose<CR>', { desc = 'Close current tab' })
keymap('n', '<leader>tn', '<cmd>tabn<CR>', { desc = 'Go to next tab' })
keymap('n', '<leader>tp', '<cmd>tabp<CR>', { desc = 'Go to previous tab' })

-- Buffer management
keymap('n', '<leader>bd', '<cmd>bdelete<CR>', { desc = 'Delete buffer' })
keymap('n', '<leader>bn', '<cmd>bnext<CR>', { desc = 'Next buffer' })
keymap('n', '<leader>bp', '<cmd>bprevious<CR>', { desc = 'Previous buffer' })

-- Better navigation
keymap('n', '<C-h>', '<C-w><C-h>', { desc = 'Move focus to the left window' })
keymap('n', '<C-l>', '<C-w><C-l>', { desc = 'Move focus to the right window' })
keymap('n', '<C-j>', '<C-w><C-j>', { desc = 'Move focus to the lower window' })
keymap('n', '<C-k>', '<C-w><C-k>', { desc = 'Move focus to the upper window' })

-- Diagnostic keymaps
keymap('n', '[d', vim.diagnostic.goto_prev, { desc = 'Go to previous diagnostic message' })
keymap('n', ']d', vim.diagnostic.goto_next, { desc = 'Go to next diagnostic message' })
keymap('n', '<leader>q', vim.diagnostic.setloclist, { desc = 'Open diagnostic quickfix list' })

-- Format
keymap('n', '<leader>f', function()
  vim.lsp.buf.format()
end, { desc = 'Format current buffer' })

-- Deno specific commands
keymap('n', '<leader>dr', '<cmd>!deno run %<CR>', { desc = 'Run current Deno file' })
keymap('n', '<leader>dt', '<cmd>!deno test<CR>', { desc = 'Run Deno tests' })
keymap('n', '<leader>df', '<cmd>!deno fmt<CR>', { desc = 'Format with Deno' })
keymap('n', '<leader>dl', '<cmd>!deno lint<CR>', { desc = 'Lint with Deno' })`
      },
      {
        path: "lua/plugins/lsp.lua",
        description: "LSP configuration for Deno",
        content: `return {
  -- LSP Configuration & Plugins
  {
    'neovim/nvim-lspconfig',
    dependencies = {
      'williamboman/mason.nvim',
      'williamboman/mason-lspconfig.nvim',
      'WhoIsSethDaniel/mason-tool-installer.nvim',
      { 'j-hui/fidget.nvim', opts = {} },
      { 'folke/neodev.nvim', opts = {} },
    },
    config = function()
      vim.api.nvim_create_autocmd('LspAttach', {
        group = vim.api.nvim_create_augroup('lsp-attach', { clear = true }),
        callback = function(event)
          local map = function(keys, func, desc)
            vim.keymap.set('n', keys, func, { buffer = event.buf, desc = 'LSP: ' .. desc })
          end

          -- Jump to the definition of the word under your cursor
          map('gd', require('telescope.builtin').lsp_definitions, '[G]oto [D]efinition')
          map('gr', require('telescope.builtin').lsp_references, '[G]oto [R]eferences')
          map('gI', require('telescope.builtin').lsp_implementations, '[G]oto [I]mplementation')
          map('<leader>D', require('telescope.builtin').lsp_type_definitions, 'Type [D]efinition')
          map('<leader>ds', require('telescope.builtin').lsp_document_symbols, '[D]ocument [S]ymbols')
          map('<leader>ws', require('telescope.builtin').lsp_dynamic_workspace_symbols, '[W]orkspace [S]ymbols')
          map('<leader>rn', vim.lsp.buf.rename, '[R]e[n]ame')
          map('<leader>ca', vim.lsp.buf.code_action, '[C]ode [A]ction')
          map('K', vim.lsp.buf.hover, 'Hover Documentation')
          map('gD', vim.lsp.buf.declaration, '[G]oto [D]eclaration')

          -- Highlight references under cursor
          local client = vim.lsp.get_client_by_id(event.data.client_id)
          if client and client.server_capabilities.documentHighlightProvider then
            vim.api.nvim_create_autocmd({ 'CursorHold', 'CursorHoldI' }, {
              buffer = event.buf,
              callback = vim.lsp.buf.document_highlight,
            })

            vim.api.nvim_create_autocmd({ 'CursorMoved', 'CursorMovedI' }, {
              buffer = event.buf,
              callback = vim.lsp.buf.clear_references,
            })
          end
        end,
      })

      local capabilities = vim.lsp.protocol.make_client_capabilities()
      capabilities = vim.tbl_deep_extend('force', capabilities, require('cmp_nvim_lsp').default_capabilities())

      local servers = {
        denols = {
          root_dir = require('lspconfig.util').root_pattern('deno.json', 'deno.jsonc'),
          init_options = {
            lint = true,
            unstable = true,
            suggest = {
              imports = {
                hosts = {
                  ["https://deno.land"] = true,
                  ["https://cdn.nest.land"] = true,
                  ["https://crux.land"] = true
                }
              }
            }
          },
          settings = {
            deno = {
              enable = true,
              lint = true,
              unstable = true,
              suggest = {
                imports = {
                  hosts = {
                    ["https://deno.land"] = true,
                    ["https://cdn.nest.land"] = true,
                    ["https://crux.land"] = true
                  }
                }
              }
            }
          }
        },
      }

      require('mason').setup()
      local ensure_installed = vim.tbl_keys(servers or {})
      vim.list_extend(ensure_installed, {
        'stylua', -- Used to format lua code
        'deno',   -- Deno LSP
      })
      require('mason-tool-installer').setup { ensure_installed = ensure_installed }

      require('mason-lspconfig').setup {
        handlers = {
          function(server_name)
            local server = servers[server_name] or {}
            server.capabilities = vim.tbl_deep_extend('force', {}, capabilities, server.capabilities or {})
            require('lspconfig')[server_name].setup(server)
          end,
        }
      }
    end,
  },
}`
      },
      {
        path: "lua/plugins/completion.lua",
        description: "Auto-completion setup",
        content: `return {
  {
    'hrsh7th/nvim-cmp',
    event = 'InsertEnter',
    dependencies = {
      {
        'L3MON4D3/LuaSnip',
        build = (function()
          return 'make install_jsregexp'
        end)(),
        dependencies = {
          'rafamadriz/friendly-snippets',
        },
      },
      'saadparwaiz1/cmp_luasnip',
      'hrsh7th/cmp-nvim-lsp',
      'hrsh7th/cmp-path',
      'hrsh7th/cmp-buffer',
    },
    config = function()
      local cmp = require 'cmp'
      local luasnip = require 'luasnip'
      luasnip.config.setup {}

      require('luasnip.loaders.from_vscode').lazy_load()

      cmp.setup {
        snippet = {
          expand = function(args)
            luasnip.lsp_expand(args.body)
          end,
        },
        completion = { completeopt = 'menu,menuone,noinsert' },
        mapping = cmp.mapping.preset.insert {
          ['<C-n>'] = cmp.mapping.select_next_item(),
          ['<C-p>'] = cmp.mapping.select_prev_item(),
          ['<C-b>'] = cmp.mapping.scroll_docs(-4),
          ['<C-f>'] = cmp.mapping.scroll_docs(4),
          ['<C-y>'] = cmp.mapping.confirm { select = true },
          ['<C-Space>'] = cmp.mapping.complete {},
          ['<C-l>'] = cmp.mapping(function()
            if luasnip.expand_or_locally_jumpable() then
              luasnip.expand_or_jump()
            end
          end, { 'i', 's' }),
          ['<C-h>'] = cmp.mapping(function()
            if luasnip.locally_jumpable(-1) then
              luasnip.jump(-1)
            end
          end, { 'i', 's' }),
        },
        sources = {
          { name = 'nvim_lsp' },
          { name = 'luasnip' },
          { name = 'path' },
          { name = 'buffer' },
        },
      }
    end,
  },
}`
      },
      {
        path: "lua/plugins/treesitter.lua",
        description: "Treesitter syntax highlighting",
        content: `return {
  {
    'nvim-treesitter/nvim-treesitter',
    build = ':TSUpdate',
    dependencies = {
      'nvim-treesitter/nvim-treesitter-textobjects',
    },
    config = function()
      require('nvim-treesitter.configs').setup {
        ensure_installed = {
          'bash',
          'c',
          'html',
          'lua',
          'markdown',
          'vim',
          'vimdoc',
          'typescript',
          'javascript',
          'tsx',
          'json',
          'yaml',
        },
        auto_install = true,
        highlight = { enable = true },
        indent = { enable = true },
        textobjects = {
          select = {
            enable = true,
            lookahead = true,
            keymaps = {
              ['aa'] = '@parameter.outer',
              ['ia'] = '@parameter.inner',
              ['af'] = '@function.outer',
              ['if'] = '@function.inner',
              ['ac'] = '@class.outer',
              ['ic'] = '@class.inner',
            },
          },
          move = {
            enable = true,
            set_jumps = true,
            goto_next_start = {
              [']m'] = '@function.outer',
              [']]'] = '@class.outer',
            },
            goto_next_end = {
              [']M'] = '@function.outer',
              [']['] = '@class.outer',
            },
            goto_previous_start = {
              ['[m'] = '@function.outer',
              ['[['] = '@class.outer',
            },
            goto_previous_end = {
              ['[M'] = '@function.outer',
              ['[]'] = '@class.outer',
            },
          },
        },
      }
    end,
  },
}`
      },
      {
        path: "lua/plugins/telescope.lua",
        description: "Fuzzy finder and search",
        content: `return {
  {
    'nvim-telescope/telescope.nvim',
    event = 'VimEnter',
    branch = '0.1.x',
    dependencies = {
      'nvim-lua/plenary.nvim',
      {
        'nvim-telescope/telescope-fzf-native.nvim',
        build = 'make',
        cond = function()
          return vim.fn.executable 'make' == 1
        end,
      },
      { 'nvim-telescope/telescope-ui-select.nvim' },
      { 'nvim-tree/nvim-web-devicons', enabled = vim.g.have_nerd_font },
    },
    config = function()
      require('telescope').setup {
        extensions = {
          ['ui-select'] = {
            require('telescope.themes').get_dropdown(),
          },
        },
      }

      pcall(require('telescope').load_extension, 'fzf')
      pcall(require('telescope').load_extension, 'ui-select')

      local builtin = require 'telescope.builtin'
      vim.keymap.set('n', '<leader>sh', builtin.help_tags, { desc = '[S]earch [H]elp' })
      vim.keymap.set('n', '<leader>sk', builtin.keymaps, { desc = '[S]earch [K]eymaps' })
      vim.keymap.set('n', '<leader>sf', builtin.find_files, { desc = '[S]earch [F]iles' })
      vim.keymap.set('n', '<leader>ss', builtin.builtin, { desc = '[S]earch [S]elect Telescope' })
      vim.keymap.set('n', '<leader>sw', builtin.grep_string, { desc = '[S]earch current [W]ord' })
      vim.keymap.set('n', '<leader>sg', builtin.live_grep, { desc = '[S]earch by [G]rep' })
      vim.keymap.set('n', '<leader>sd', builtin.diagnostics, { desc = '[S]earch [D]iagnostics' })
      vim.keymap.set('n', '<leader>sr', builtin.resume, { desc = '[S]earch [R]esume' })
      vim.keymap.set('n', '<leader>s.', builtin.oldfiles, { desc = '[S]earch Recent Files ("." for repeat)' })
      vim.keymap.set('n', '<leader><leader>', builtin.buffers, { desc = '[ ] Find existing buffers' })
    end,
  },
}`
      },
      {
        path: "lua/plugins/ui.lua",
        description: "UI enhancements and theme",
        content: `return {
  -- Theme
  {
    'folke/tokyonight.nvim',
    priority = 1000,
    init = function()
      vim.cmd.colorscheme 'tokyonight-night'
    end,
  },

  -- Status line
  {
    'nvim-lualine/lualine.nvim',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      require('lualine').setup {
        options = {
          icons_enabled = true,
          theme = 'tokyonight',
          component_separators = '|',
          section_separators = '',
        },
      }
    end,
  },

  -- File explorer
  {
    'nvim-tree/nvim-tree.lua',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      require('nvim-tree').setup {
        view = {
          width = 30,
        },
        renderer = {
          group_empty = true,
        },
        filters = {
          dotfiles = false,
        },
      }
      vim.keymap.set('n', '<leader>e', ':NvimTreeToggle<CR>', { desc = 'Toggle file [E]xplorer' })
    end,
  },

  -- Indent guides
  {
    'lukas-reineke/indent-blankline.nvim',
    main = 'ibl',
    opts = {},
  },

  -- Git integration
  {
    'lewis6991/gitsigns.nvim',
    opts = {
      signs = {
        add = { text = '+' },
        change = { text = '~' },
        delete = { text = '_' },
        topdelete = { text = '‾' },
        changedelete = { text = '~' },
      },
    },
  },
}`
      }
    ];
  }

  private async createConfigFiles(): Promise<void> {
    console.log("📝 Creating configuration files...");

    const configFiles = this.getConfigFiles();

    for (const configFile of configFiles) {
      const fullPath = join(this.configDir, configFile.path);
      const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));

      // Ensure directory exists
      await ensureDir(dir);

      // Write the file
      await Deno.writeTextFile(fullPath, configFile.content);
      console.log(`✅ Created: ${configFile.description}`);
    }

    // Create undo directory
    await ensureDir(join(this.configDir, "undo"));
    console.log("✅ Created undo directory");
  }

  private async createSampleDenoProject(): Promise<void> {
    console.log("📄 Creating sample Deno project...");

    const projectDir = join(Deno.cwd(), "deno-sample-project");
    await ensureDir(projectDir);

    const denoConfig = {
      tasks: {
        dev: "deno run --watch --allow-all main.ts",
        start: "deno run --allow-all main.ts",
        test: "deno test --allow-all",
        fmt: "deno fmt",
        lint: "deno lint"
      },
      imports: {
        "@std/": "https://deno.land/std@0.208.0/"
      },
      compilerOptions: {
        allowJs: true,
        lib: ["deno.window"],
        strict: true
      },
      lint: {
        rules: {
          tags: ["recommended"]
        }
      },
      fmt: {
        useTabs: false,
        lineWidth: 100,
        indentWidth: 2,
        semiColons: true,
        singleQuote: false,
        proseWrap: "preserve"
      }
    };

    await Deno.writeTextFile(
      join(projectDir, "deno.json"),
      JSON.stringify(denoConfig, null, 2)
    );

    const mainTs = `#!/usr/bin/env deno run --allow-all

/**
 * Sample Deno TypeScript application
 * This demonstrates the IDE capabilities in Neovim
 */

import { serve } from "@std/http/server.ts";

interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private users: User[] = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
  ];

  getAllUsers(): User[] {
    return this.users;
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  addUser(user: Omit<User, 'id'>): User {
    const newUser: User = {
      id: this.users.length + 1,
      ...user,
    };
    this.users.push(newUser);
    return newUser;
  }
}

const userService = new UserService();

const handler = (req: Request): Response => {
  const url = new URL(req.url);

  if (url.pathname === "/users" && req.method === "GET") {
    return new Response(JSON.stringify(userService.getAllUsers()), {
      headers: { "content-type": "application/json" },
    });
  }

  if (url.pathname.startsWith("/users/") && req.method === "GET") {
    const id = parseInt(url.pathname.split("/")[2]);
    const user = userService.getUserById(id);

    if (user) {
      return new Response(JSON.stringify(user), {
        headers: { "content-type": "application/json" },
      });
    } else {
      return new Response("User not found", { status: 404 });
    }
  }

  return new Response("Not found", { status: 404 });
};

console.log("🚀 Server starting on http://localhost:8000");
await serve(handler, { port: 8000 });
`;

    await Deno.writeTextFile(join(projectDir, "main.ts"), mainTs);

    const testFile = `import { assertEquals } from "@std/assert/mod.ts";

// Sample test to demonstrate testing capabilities
Deno.test("basic math test", () => {
  assertEquals(2 + 2, 4);
});

Deno.test("string manipulation", () => {
  const str = "Hello, Deno!";
  assertEquals(str.toLowerCase(), "hello, deno!");
});
`;

    await Deno.writeTextFile(join(projectDir, "main_test.ts"), testFile);

    console.log(`✅ Sample project created at: ${projectDir}`);
    console.log("   You can test the setup by running:");
    console.log(`   cd ${projectDir} && nvim main.ts`);
  }

  private printUsageInstructions(): void {
    console.log("\n🎉 Neovim Deno TypeScript IDE setup complete!");
    console.log("\n📚 Quick Start Guide:");
    console.log("1. Start Neovim: nvim");
    console.log("2. Wait for plugins to install automatically");
    console.log("3. Open a TypeScript file in a Deno project");
    console.log("\n🔧 Essential Key Bindings:");
    console.log("  <Space>     - Leader key");
    console.log("  <leader>sf  - Find files");
    console.log("  <leader>sg  - Search text in project");
    console.log("  <leader>e   - Toggle file explorer");
    console.log("  gd          - Go to definition");
    console.log("  gr          - Find references");
    console.log("  K           - Show hover documentation");
    console.log("  <leader>ca  - Code actions");
    console.log("  <leader>f   - Format file");
    console.log("  <leader>dr  - Run current Deno file");
    console.log("  <leader>dt  - Run Deno tests");
    console.log("\n🔍 Deno Project Detection:");
    console.log("  IDE features activate automatically in directories with deno.json or deno.jsonc");
    console.log("\n🚀 Try the sample project:");
    console.log("  cd deno-sample-project && nvim main.ts");

    if (await exists(this.backupDir)) {
      console.log(`\n📦 Your previous configuration was backed up to: ${this.backupDir}`);
    }

    console.log("\n💡 Tips:");
    console.log("  - Use :checkhealth to verify everything is working");
    console.log("  - The setup automatically detects Deno projects");
    console.log("  - All plugins will install on first Neovim launch");
    console.log("  - Check ~/.config/nvim/ for the full configuration");
  }

  public async run(): Promise<void> {
    try {
      console.log("🚀 Neovim Deno TypeScript IDE Auto-Setup");
      console.log("=" .repeat(50));

      await this.checkPrerequisites();
      await this.backupExistingConfig();

      // Create config directory
      await ensureDir(this.configDir);

      await this.createConfigFiles();
      await this.createSampleDenoProject();

      this.printUsageInstructions();

    } catch (error) {
      console.error(`❌ Setup failed: ${error.message}`);
      Deno.exit(1);
    }
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Neovim Deno TypeScript IDE Auto-Setup

USAGE:
    deno run --allow-read --allow-write --allow-run setup-nvim.ts [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    --dry-run           Show what would be done without making changes
    --no-sample         Skip creating the sample Deno project

EXAMPLES:
    # Full setup with sample project
    deno run --allow-read --allow-write --allow-run setup-nvim.ts

    # Setup without sample project
    deno run --allow-read --allow-write --allow-run setup-nvim.ts --no-sample

FEATURES:
    ✅ Complete LSP setup for Deno + TypeScript
    ✅ Auto-completion with intelligent suggestions
    ✅ Syntax highlighting and code formatting
    ✅ File explorer and fuzzy finding
    ✅ Git integration and status indicators
    ✅ Automatic Deno project detection
    ✅ IDE-like navigation and refactoring tools

REQUIREMENTS:
    - Neovim 0.8+ (preferably 0.9+)
    - Deno (latest version recommended)
    - Git (for plugin management)
    `);
    return;
  }

  if (args.includes("--dry-run")) {
    console.log("🔍 DRY RUN MODE - No changes will be made");
    console.log("\nThis setup would:");
    console.log("1. Check for Neovim, Deno, and Git");
    console.log("2. Backup existing ~/.config/nvim to ~/.config/nvim.backup");
    console.log("3. Create new Neovim configuration with:");
    console.log("   - LSP setup for Deno TypeScript");
    console.log("   - Auto-completion engine");
    console.log("   - File explorer and fuzzy finder");
    console.log("   - Syntax highlighting");
    console.log("   - Git integration");
    console.log("   - Custom keybindings");

    if (!args.includes("--no-sample")) {
      console.log("4. Create sample Deno project for testing");
    }
    return;
  }

  const setup = new NeovimSetup();

  // Override createSampleDenoProject if --no-sample is specified
  if (args.includes("--no-sample")) {
    setup.createSampleDenoProject = async () => {
      console.log("⏭️  Skipping sample project creation");
    };
  }

  await setup.run();
}

// Run the setup if this file is executed directly
if (import.meta.main) {
  await main();
}
