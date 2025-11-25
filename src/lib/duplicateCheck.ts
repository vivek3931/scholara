import { prisma } from '@/lib/db';
import { calculateFileHashes, compareFuzzyHash } from '@/lib/hash';

const FUZZY_SIMILARITY_THRESHOLD = 80; // 80% match = duplicate (fuzzy is stricter than TLSH)

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: string;
  similarResource?: any;
  similarity?: number;
}

/**
 * Main duplicate detection function
 * Layer 1: Exact SHA256 match (< 1ms)
 * Layer 2: TLSH similarity (< 100ms)
 */
export async function checkDuplicate(
  fileUrl: string,
  userId: string,
  excludeResourceId?: string
): Promise<DuplicateCheckResult> {
  try {
    console.log('🔍 Starting duplicate check...');

    // Calculate hashes for uploaded file
    const { sha256, fuzzyHash, fileSize } = await calculateFileHashes(fileUrl);
    console.log(`✓ Hashes calculated - SHA256: ${sha256.substring(0, 8)}...`);

    // ========== LAYER 1: SHA256 Check (Exact Match) ==========
    if (sha256) {
      const exactDuplicate = await prisma.resource.findFirst({
        where: {
          fileHash: sha256,
          ...(excludeResourceId && { id: { not: excludeResourceId } }),
        },
        select: { id: true, title: true, author: { select: { email: true } } },
      });

      if (exactDuplicate) {
        console.log('⚠️  DUPLICATE FOUND: Exact SHA256 match');
        return {
          isDuplicate: true,
          reason: 'Identical file already exists',
          similarResource: exactDuplicate,
        };
      }
    }

    // ========== LAYER 2: Fuzzy Hash Check (Smart Similarity) ==========
    if (fuzzyHash) {
      console.log('🔎 Checking Fuzzy hash similarity...');
      
      const allResources = await prisma.resource.findMany({
        where: {
          tlshHash: { not: null },
          ...(excludeResourceId && { id: { not: excludeResourceId } }),
        },
        select: {
          id: true,
          title: true,
          tlshHash: true,
          author: { select: { email: true } },
        },
      });

      for (const resource of allResources) {
        if (resource.tlshHash) {
          const similarity = compareFuzzyHash(fuzzyHash, resource.tlshHash);

          if (similarity >= FUZZY_SIMILARITY_THRESHOLD) {
            console.log(`⚠️  DUPLICATE FOUND: Fuzzy match ${similarity}%`);
            return {
              isDuplicate: true,
              reason: `Similar file detected (${similarity}% match)`,
              similarResource: resource,
              similarity,
            };
          }
        }
      }
    }

    console.log('✅ No duplicates found - OK to proceed');
    return {
      isDuplicate: false,
      similarity: 0,
    };

  } catch (error) {
    console.error('Error in duplicate check:', error);
    // On error, allow upload (fail-open approach)
    return {
      isDuplicate: false,
      reason: 'Duplicate check failed - allowing upload',
    };
  }
}

/**
 * Store file hashes in database after duplicate check passes
 */
export async function storeFileHashes(
  resourceId: string,
  fileUrl: string
): Promise<void> {
  try {
    const { sha256, fuzzyHash, fileSize } = await calculateFileHashes(fileUrl);

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        fileHash: sha256,
        tlshHash: fuzzyHash,
        fileSize,
      },
    });

    console.log('✓ File hashes stored in database');
  } catch (error) {
    console.error('Error storing file hashes:', error);
    // Don't fail the upload if hash storage fails
  }
}