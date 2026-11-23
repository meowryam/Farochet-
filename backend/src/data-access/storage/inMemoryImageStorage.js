import { randomUUID } from "node:crypto";

/**
 * Cycle 2 in-memory image-storage stub.
 *
 * ADR-006 requires a private Supabase Storage bucket, backend-mediated upload,
 * and object paths/metadata persisted in PostgreSQL. The real Supabase adapter
 * is intentionally not built in this slice. This stub only implements the
 * injected interface so the submission workflow and its tests can run without
 * a storage provider; it does not persist image bytes across restarts.
 */
function createInMemoryImageStorage() {
  const objects = new Map();

  return {
    async storeImages({ customerId, images = [] }) {
      return images.map((image) => {
        const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `customization/${customerId}/${randomUUID()}-${safeName}`;
        objects.set(path, {
          path,
          name: image.name,
          contentType: image.contentType,
          sizeBytes: image.sizeBytes,
          base64: image.base64,
        });

        return {
          path,
          name: image.name,
          contentType: image.contentType,
          sizeBytes: image.sizeBytes,
        };
      });
    },

    /**
     * Backend-mediated retrieval of a stored object by its persisted path.
     * Returns metadata plus the stored bytes; it never produces a public URL.
     */
    getImage(path) {
      const object = objects.get(path);
      return object ? { ...object } : null;
    },
  };
}

export { createInMemoryImageStorage };
export default createInMemoryImageStorage;
