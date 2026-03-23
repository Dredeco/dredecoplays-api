const path = require('path');
const sharp = require('sharp');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'public/uploads');

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const baseUrlClean = baseUrl.replace(/\/$/, '');

    const ext = path.extname(req.file.originalname).toLowerCase();
    const baseName = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const buffer = req.file.buffer;

    const meta = await sharp(buffer).metadata();
    const originalWidth = meta.width;

    if (originalWidth && originalWidth < 1200) {
      console.warn(`[upload] Imagem com largura ${originalWidth}px (< 1200px); redimensionada para 1200px.`);
    }

    let pipeline = sharp(buffer);
    if (originalWidth && originalWidth < 1200) {
      pipeline = pipeline.resize({ width: 1200, withoutEnlargement: false });
    }

    const processedBuffer = await pipeline.toBuffer();
    const outMeta = await sharp(processedBuffer).metadata();
    const finalWidth = outMeta.width || 1200;
    const finalHeight = outMeta.height || 630;

    let savedOriginalName;
    if (ext === '.jpg' || ext === '.jpeg') {
      savedOriginalName = `${baseName}.jpg`;
      await sharp(processedBuffer).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(uploadDir, savedOriginalName));
    } else if (ext === '.png') {
      savedOriginalName = `${baseName}.png`;
      await sharp(processedBuffer).png({ compressionLevel: 9 }).toFile(path.join(uploadDir, savedOriginalName));
    } else if (ext === '.gif') {
      savedOriginalName = `${baseName}.png`;
      await sharp(processedBuffer).png({ compressionLevel: 9 }).toFile(path.join(uploadDir, savedOriginalName));
    } else if (ext === '.webp') {
      savedOriginalName = `${baseName}.webp`;
      await sharp(processedBuffer).webp({ quality: 90 }).toFile(path.join(uploadDir, savedOriginalName));
    } else {
      savedOriginalName = `${baseName}.jpg`;
      await sharp(processedBuffer).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(uploadDir, savedOriginalName));
    }

    const webpFilename = `${baseName}.webp`;
    const webpFullPath = path.join(uploadDir, webpFilename);

    if (ext === '.webp' && savedOriginalName === webpFilename) {
      // Um único arquivo WebP serve como original e variante
      res.status(201).json({
        data: {
          url: `${baseUrlClean}/uploads/${savedOriginalName}`,
          webpUrl: `${baseUrlClean}/uploads/${savedOriginalName}`,
          width: finalWidth,
          height: finalHeight,
        },
      });
      return;
    }

    await sharp(processedBuffer).webp({ quality: 85 }).toFile(webpFullPath);

    res.status(201).json({
      data: {
        url: `${baseUrlClean}/uploads/${savedOriginalName}`,
        webpUrl: `${baseUrlClean}/uploads/${webpFilename}`,
        width: finalWidth,
        height: finalHeight,
      },
    });
  } catch (err) {
    next(err);
  }
};
