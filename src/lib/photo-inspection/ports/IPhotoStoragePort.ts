/**
 * IPhotoStoragePort - Port Interface
 * 
 * Interface for storing inspection photos (S3, Cloudinary, etc).
 */

export interface IPhotoStoragePort {
    /**
     * Upload an image and return the public URL
     */
    uploadPhoto(imageData: Uint8Array, siteId: string): Promise<string>;

    /**
     * Get public URL for a photo key
     */
    getPhotoUrl(key: string): string;

    /**
     * Delete a photo
     */
    deletePhoto(key: string): Promise<void>;
}
