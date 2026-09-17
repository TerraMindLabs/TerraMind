const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const htmlPath = path.join(__dirname, 'client', 'index.html');

console.log('Starting title update to TerraMind...');

// Update .env
if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('APP_TITLE=LibreChat')) {
        envContent = envContent.replace(/APP_TITLE=LibreChat/g, 'APP_TITLE=TerraMind');
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✅ Updated APP_TITLE in .env');
    } else {
        console.log('⚠️ Could not find "APP_TITLE=LibreChat" in .env. It might have already been updated or the line is missing.');
    }
} else {
    console.error('❌ .env file not found at:', envPath);
}

// Update client/index.html
if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    let htmlUpdated = false;

    if (htmlContent.includes('<title>LibreChat</title>')) {
        htmlContent = htmlContent.replace(/<title>LibreChat<\/title>/g, '<title>TerraMind</title>');
        htmlUpdated = true;
        console.log('✅ Updated <title> in index.html');
    } else {
        console.log('⚠️ Could not find "<title>LibreChat</title>" in index.html.');
    }

    if (htmlContent.includes('content="LibreChat"')) {
        htmlContent = htmlContent.replace(/content="LibreChat"/g, 'content="TerraMind"');
        htmlUpdated = true;
        console.log('✅ Updated meta description in index.html');
    } else if (htmlContent.includes('LibreChat')) {
        htmlContent = htmlContent.replace(/LibreChat/g, 'TerraMind');
        htmlUpdated = true;
        console.log('✅ Replaced other occurrences of LibreChat in index.html');
    }

    if (htmlUpdated) {
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    }
} else {
    console.error('❌ index.html file not found at:', htmlPath);
}

console.log('Finished updating title.');
