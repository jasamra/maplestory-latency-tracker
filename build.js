const ejs = require('ejs');
const fs = require('fs');

// Read the EJS template file
const template = fs.readFileSync('views/index.ejs', 'utf8');

// Data to pass to the template (if needed)
const data = {
    // Add your data here
};

// Compile the template
const html = ejs.render(template, data);

// Write the compiled HTML to a file
fs.writeFileSync('index.html', html);

console.log('HTML file generated successfully!');
