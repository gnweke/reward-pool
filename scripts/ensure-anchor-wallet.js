const fs = require('fs');
const path = require('path');

const tomlPath = path.join(process.cwd(), 'Anchor.toml');
const src = fs.readFileSync(tomlPath, 'utf8');

// Normalize wallet path
const desired = process.env.ANCHOR_WALLET || '~/.config/solana/id.json';

// Replace any $(whoami) occurrences first
let out = src.replace(/\/Users\/\$\(whoami\)/g, '~');

// Ensure [provider].wallet is set correctly
if (out.match(/\[provider\][\s\S]*?wallet\s*=\s*".*?"/)) {
  out = out.replace(/(\[provider\][\s\S]*?wallet\s*=\s*)".*?"/, `$1"${desired}"`);
} else {
  out = out.replace(/\[provider\][\s\S]*?\n/, m => m + `wallet = "${desired}"\n`);
}

// If upgrade_authority exists anywhere, set it to the same value
if (out.includes('upgrade_authority')) {
  out = out.replace(/upgrade_authority\s*=\s*".*?"/g, `upgrade_authority = "${desired}"`);
}

fs.writeFileSync(tomlPath, out);
console.log('Updated Anchor.toml wallet/upgrade_authority to:', desired);

