const express = require('express');
const { exec } = require('child_process');
const { writeFile, readFile, unlink } = require('fs/promises');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 16842;

app.post('/convert-latex', async (req, res) => {
  console.log('Received LaTeX conversion request. Processing...');

  const { latex } = req.body;
  const id = uuidv4();
  const inputPath = join('/tmp', `${id}.tex`);
  const outputPath = join('/tmp', `${id}.pdf`);

  try {
    console.log(`Writing LaTeX content to temporary file: ${inputPath}`);
    await writeFile(inputPath, latex);

    console.log('Converting LaTeX to PDF...');
    await new Promise((resolve, reject) => {
//       exec(`pdflatex -output-directory /tmp ${inputPath}`, (error) => {
//       exec(`latexmk -output-directory /tmp ${inputPath}`, (error) => {
      exec(`latexmk -pdf -file-line-error -synctex=1 -interaction=nonstopmode -shell-escape -f -output-directory=/tmp ${inputPath}`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    console.log(`Reading generated PDF: ${outputPath}`);
    const pdfBuffer = await readFile(outputPath);

    console.log('Cleaning up temporary files...');
    await Promise.all([
      unlink(inputPath),
      unlink(outputPath),
      unlink(join('/tmp', `${id}.aux`)),
      unlink(join('/tmp', `${id}.log`)),
    ]);

    console.log('Sending PDF response...');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);

    console.log('LaTeX conversion completed successfully.');
  } catch (error) {
    console.error('Error converting LaTeX to PDF:', error);
    res.status(500).json({ error: 'Failed to convert LaTeX to PDF' });
  }
});

app.listen(PORT, () => {
  console.log(`LaTeX conversion server running on port ${PORT}`);
  console.log('Waiting for conversion requests...');
});

