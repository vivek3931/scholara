import crypto from 'crypto';

/**
 * Generate SHA256 hash from file buffer
 */
export async function generateSHA256(buffer: Buffer): Promise<string> {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate file size
 */
export function getFileSize(buffer: Buffer): number {
  return buffer.length;
}

/**
 * Simple fuzzy hash using content chunks
 * Instead of TLSH library, we create our own fuzzy hash
 */
export function generateFuzzyHash(buffer: Buffer): string {
  try {
    // Create a simplified fuzzy hash by dividing file into chunks
    // and hashing each chunk
    const chunkSize = 4096; // 4KB chunks
    const chunks: string[] = [];
    
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      const chunkHash = crypto
        .createHash('sha1')
        .update(chunk)
        .digest('hex')
        .substring(0, 8);
      chunks.push(chunkHash);
    }
    
    return chunks.join(':');
  } catch (error) {
    console.error('Error generating fuzzy hash:', error);
    return '';
  }
}

/**
 * Compare fuzzy hashes - calculate similarity percentage
 * Returns 0-100 similarity score
 */
export function compareFuzzyHash(hash1: string, hash2: string): number {
  try {
    if (!hash1 || !hash2) return 0;
    
    const chunks1 = hash1.split(':');
    const chunks2 = hash2.split(':');
    
    // If very different sizes, probably different files
    const sizeDiff = Math.abs(chunks1.length - chunks2.length);
    if (sizeDiff > chunks1.length * 0.3) return 0; // More than 30% different = likely different
    
    // Count matching chunks
    let matches = 0;
    const minLength = Math.min(chunks1.length, chunks2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (chunks1[i] === chunks2[i]) {
        matches++;
      }
    }
    
    // Calculate similarity as percentage
    const similarity = Math.round((matches / minLength) * 100);
    return Math.max(0, Math.min(100, similarity));
  } catch (error) {
    console.error('Error comparing fuzzy hashes:', error);
    return 0;
  }
}

/**
 * Calculate file hashes from Cloudinary URL
 * Downloads the file and generates SHA256 + Fuzzy Hash
 */
export async function calculateFileHashes(fileUrl: string): Promise<{
  sha256: string;
  fuzzyHash: string;
  fileSize: number;
}> {
  try {
    console.log('📥 Downloading file from Cloudinary...');
    
    // Download file from Cloudinary
    const response = await fetch(fileUrl, { 
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const bufferNode = Buffer.from(buffer);

    console.log(`✓ File downloaded: ${bufferNode.length} bytes`);

    // Generate SHA256
    const sha256 = await generateSHA256(bufferNode);
    console.log(`✓ SHA256 generated: ${sha256.substring(0, 16)}...`);

    // Generate Fuzzy Hash
    const fuzzyHash = generateFuzzyHash(bufferNode);
    console.log(`✓ Fuzzy hash generated`);

    return {
      sha256,
      fuzzyHash,
      fileSize: bufferNode.length,
    };
  } catch (error) {
    console.error('❌ Error calculating file hashes:', error);
    throw error;
  }
}