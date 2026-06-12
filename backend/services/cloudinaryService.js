const { cloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

const uploadFile = async (filePath, folder = 'resumes') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `resumelens/${folder}`,
      resource_type: 'raw',
      use_filename: true,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
    };
  } catch (error) {
    logger.error('Cloudinary upload failed:', error);
    throw error;
  }
};

const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (error) {
    logger.error('Cloudinary delete failed:', error);
  }
};

module.exports = { uploadFile, deleteFile };
