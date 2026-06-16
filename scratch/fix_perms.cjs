const fs = require('fs');
const path = require('path');

const mapModule = (dirPath) => {
  if (dirPath.includes('categories')) {
    if (dirPath.includes('finance')) return 'finance';
    if (dirPath.includes('blog')) return 'blog';
    return 'products'; // Main categories
  }
  if (dirPath.includes('coupons') || dirPath.includes('popups')) return 'marketing';
  if (dirPath.includes('finance')) return 'finance';
  if (dirPath.includes('roles') || dirPath.includes('users')) return 'users';
  if (dirPath.includes('products')) return 'products';
  if (dirPath.includes('orders')) return 'orders';
  if (dirPath.includes('payment-methods') || dirPath.includes('config')) return 'settings';
  if (dirPath.includes('crm')) return 'crm';
  if (dirPath.includes('blog')) return 'blog';
  if (dirPath.includes('inventory')) return 'inventory';
  return null;
};

const processFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('checkPermission(cookies')) return; // Already processed
  
  const mod = mapModule(filePath);
  if (!mod) return;

  let newContent = content;

  // Add import if needed
  if (newContent.includes('import { requireAdmin } from')) {
    newContent = newContent.replace(/import \{ requireAdmin \} from (.*);/, "import { requireAdmin, checkPermission } from $1;");
  } else if (!newContent.includes('checkPermission')) {
    newContent = newContent.replace(/import \{ (.*getSessionUser.*) \} from (.*);/, "import { $1, checkPermission } from $2;");
  }

  // Regex to inject checkPermission after requireAdmin
  const methods = [
    { method: 'POST', action: 'create' },
    { method: 'PUT', action: 'update' },
    { method: 'DELETE', action: 'delete' },
  ];

  for (const { method, action } of methods) {
    const regex = new RegExp(`(export const ${method}: APIRoute = async [\\s\\S]*?const admin = requireAdmin\\(cookies\\);\\s*if \\(!admin\\) return new Response\\(JSON\\.stringify\\(\\{ error: 'Unauthorized' \\}\\), \\{ status: 401 \\}\\);)`, 'g');
    
    newContent = newContent.replace(regex, `$1\n  const can${method} = await checkPermission(cookies, '${mod}', '${action}');\n  if (!can${method}) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });\n`);
  }

  if (content !== newContent) {
    console.log('Updated:', filePath);
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
};

const walk = (dir) => {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.ts')) {
      processFile(filePath);
    }
  }
};

walk(path.join(__dirname, '../src/pages/api'));
