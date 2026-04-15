const fs = require('fs');
try {
    const data = fs.readFileSync('out.json', 'utf16le');
    console.log(data);
} catch (e) {
    console.error(e);
}
