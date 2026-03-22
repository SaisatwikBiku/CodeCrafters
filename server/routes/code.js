const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

router.post('/run', async (req, res) => {
  const { source_code, expected_output } = req.body;
  if (!source_code) return res.status(400).json({ error: 'source_code required' });

  // Write code to a temp file
  const tmpFile = path.join('/tmp', `${uuidv4()}.py`);
  fs.writeFileSync(tmpFile, source_code);

  exec(`python3 ${tmpFile}`, { timeout: 5000 }, (err, stdout, stderr) => {
    // Clean up temp file
    fs.unlink(tmpFile, () => {});

    if (err && !stdout) {
      return res.json({
        stdout: '',
        stderr: stderr || err.message,
        status: 'Error',
        passed: false,
      });
    }

    let passed = null;
    if (expected_output !== undefined && expected_output !== null) {
      passed = (stdout || '').trim() === expected_output.trim();
    }

    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      status: 'Accepted',
      passed,
    });
  });
});

module.exports = router;