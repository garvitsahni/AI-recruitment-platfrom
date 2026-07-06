'use strict';

const unzipper = require('unzipper');
const mime = require('mime-types');
const path = require('path');
const { logger } = require('../utils/logger');
const storage = require('./storage');
const { ValidationError } = require('../utils/errors');

/**
 * ZIP Import Service.
 *
 * Per PRD v3 FR-04: "A ZIP archive containing candidate application forms (PDFs)
 * and supporting documents. The system must extract the ZIP, map files to candidate rows...
 * and store them securely."
 */

/**
 * Process a ZIP file stream and upload its contents to storage.
 *
 * @param {import('stream').Readable} zipStream - The ZIP file readable stream
 * @param {string} jobId - The job ID
 * @param {string} postingCode - The posting code for the job
 * @returns {Promise<{ uploadedFiles: Object[], failedFiles: Object[], totalExtracted: number }>}
 */
async function processZipImport(zipStream, jobId, postingCode) {
  logger.info({ jobId }, 'Starting ZIP import processing');

  const uploadedFiles = [];
  const failedFiles = [];
  let totalExtracted = 0;

  try {
    const zip = zipStream.pipe(unzipper.Parse({ forceStream: true }));

    for await (const entry of zip) {
      const fileName = entry.path;
      const type = entry.type; // 'Directory' or 'File'

      if (type === 'Directory' || fileName.startsWith('__MACOSX/') || fileName.includes('/.')) {
        entry.autodrain();
        continue;
      }

      totalExtracted++;
      const mimeType = mime.lookup(fileName) || 'application/octet-stream';
      const fileBaseName = path.basename(fileName);

      try {
        // We will store all files under the job prefix.
        // We do not map to the candidate yet, that will be done via matching the zip_path from Excel
        const storageKey = storage.generateKey('document', postingCode, `imports/${Date.now()}_${fileBaseName}`);

        // Read the stream into a buffer because S3 client might need to know the length
        // or we stream it directly. To be safe, we collect to buffer for small PDFs.
        const chunks = [];
        for await (const chunk of entry) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const uploadResult = await storage.upload(storageKey, buffer, mimeType, {
          jobId,
          originalName: fileName,
        });

        uploadedFiles.push({
          originalPath: fileName,
          storageKey: uploadResult.key,
          mimeType,
          size: buffer.length,
        });
      } catch (err) {
        logger.error({ fileName, error: err.message }, 'Failed to upload extracted file');
        failedFiles.push({
          originalPath: fileName,
          error: err.message,
        });
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'ZIP parsing failed');
    throw new ValidationError('Failed to parse ZIP file: ' + error.message);
  }

  logger.info(
    {
      jobId,
      totalExtracted,
      uploadedCount: uploadedFiles.length,
      failedCount: failedFiles.length,
    },
    'ZIP import processing completed'
  );

  return { uploadedFiles, failedFiles, totalExtracted };
}

module.exports = {
  processZipImport,
};
