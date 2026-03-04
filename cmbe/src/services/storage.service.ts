import fs from 'fs';
import path from 'path';

// Abstracted interface for storage
export interface IStorageService {
    uploadFile(file: Express.Multer.File, destinationPath: string): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageService implements IStorageService {
    private baseDir: string;

    constructor() {
        this.baseDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    async uploadFile(file: Express.Multer.File, destinationPath: string): Promise<string> {
        const filePath = path.join(this.baseDir, destinationPath, file.originalname);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(filePath, file.buffer);
        return `/uploads/${destinationPath}/${file.originalname}`;
    }

    async deleteFile(fileUrl: string): Promise<void> {
        const filePath = path.join(this.baseDir, fileUrl.replace('/uploads', ''));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

// In the future this can easily be swapped: export const storageService = new S3StorageService();
export const storageService = new LocalStorageService();
