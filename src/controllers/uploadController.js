const sharp = require('sharp');

exports.uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  try {
    const compressed = await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toBuffer();
    const base64 = `data:image/webp;base64,${compressed.toString('base64')}`;

    res.status(201).json({
      data: {
        url: base64,
        path: null,
        size: compressed.length,
        mimetype: 'image/webp',
      },
    });
  } catch (err) {
    console.error('[uploadController] Sharp error:', err.message);
    res.status(500).json({ error: 'Erro ao processar a imagem.' });
  }
};
