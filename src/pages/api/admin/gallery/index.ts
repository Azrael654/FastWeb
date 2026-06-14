import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export const GET: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    // Sync physical files
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    let physicalFiles: string[] = [];
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      physicalFiles = await fs.readdir(uploadDir);
    } catch (e) {
      console.log("Error reading upload dir", e);
    }

    const existingFiles = await (prisma as any).galleryFile.findMany({ select: { filename: true } });
    const existingFilenames = new Set(existingFiles.map((f: any) => f.filename));

    const toInsert: any[] = [];
    for (const file of physicalFiles) {
      if (!existingFilenames.has(file) && !file.startsWith('.')) {
        try {
           const stat = await fs.stat(path.join(uploadDir, file));
           if (stat.isFile()) {
             toInsert.push({
               filename: file,
               originalName: file,
               url: `/uploads/${file}`,
               size: stat.size,
               mimeType: file.endsWith('.png') ? 'image/png' : file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg' : file.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream',
               createdAt: stat.birthtime
             });
           }
        } catch(e) {}
      }
    }
    
    if (toInsert.length > 0) {
      await (prisma as any).galleryFile.createMany({ data: toInsert });
    }

    const files = await (prisma as any).galleryFile.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const [products, categories, posts, popups, transactionImages] = await Promise.all([
      prisma.product.findMany({ select: { id: true, name: true, image: true, imagesArray: true } }),
      prisma.category.findMany({ select: { id: true, name: true, image: true } }),
      prisma.blogPost.findMany({ select: { id: true, title: true, image: true } }),
      prisma.popup.findMany({ select: { id: true, title: true, imageUrl: true } }),
      prisma.transaction.findMany({ select: { id: true, description: true, imageUrl: true }, where: { imageUrl: { not: null } } }),
    ]);

    const filesWithUsage = files.map((file: any) => {
      const usage: any[] = [];
      const url = file.url;

      products.forEach(p => {
        let used = p.image === url;
        if (!used && Array.isArray(p.imagesArray) && p.imagesArray.includes(url)) used = true;
        if (used) usage.push({ module: 'Product', id: p.id, name: p.name });
      });

      categories.forEach(c => {
        if (c.image === url) usage.push({ module: 'Category', id: c.id, name: c.name });
      });

      posts.forEach(p => {
        if (p.image === url) usage.push({ module: 'Blog', id: p.id, name: p.title });
      });

      popups.forEach(p => {
        if (p.imageUrl === url) usage.push({ module: 'Popup', id: p.id, name: p.title });
      });

      transactionImages.forEach(t => {
         if (t.imageUrl === url) usage.push({ module: 'Transaction', id: t.id, name: t.description || 'Transaksi' });
      });

      return {
        ...file,
        usageCount: usage.length,
        usage
      };
    });

    return new Response(JSON.stringify(filesWithUsage), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
