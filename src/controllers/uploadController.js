const path = require('path');

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const filePath = `/uploads/${req.file.filename}`;

  res.status(201).json({
    data: {
      filename: req.file.filename,
      url: `${baseUrl}${filePath}`,
      path: filePath,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
};
