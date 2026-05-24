import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.appUser.upsert({
    where: { email: 'admin@fastprint.id' },
    update: {},
    create: { name: 'Admin Fast Print', email: 'admin@fastprint.id', password: adminPassword, role: 'admin', phone: '081234567890' },
  });
  console.log('✅ Admin user:', admin.email);

  // Categories
  const cats = await Promise.all([
    prisma.category.upsert({ where: { slug: 'banner-spanduk' }, update: {}, create: { name: 'Banner & Spanduk', slug: 'banner-spanduk', description: 'Cetak banner dan spanduk outdoor/indoor' } }),
    prisma.category.upsert({ where: { slug: 'brosur-flyer' }, update: {}, create: { name: 'Brosur & Flyer', slug: 'brosur-flyer', description: 'Cetak brosur dan flyer promosi' } }),
    prisma.category.upsert({ where: { slug: 'kartu-nama' }, update: {}, create: { name: 'Kartu Nama', slug: 'kartu-nama', description: 'Cetak kartu nama profesional' } }),
    prisma.category.upsert({ where: { slug: 'stiker-label' }, update: {}, create: { name: 'Stiker & Label', slug: 'stiker-label', description: 'Cetak stiker dan label produk' } }),
    prisma.category.upsert({ where: { slug: 'buku-majalah' }, update: {}, create: { name: 'Buku & Majalah', slug: 'buku-majalah', description: 'Cetak buku, majalah, dan katalog' } }),
    prisma.category.upsert({ where: { slug: 'packaging' }, update: {}, create: { name: 'Packaging', slug: 'packaging', description: 'Cetak dus dan kemasan produk' } }),
  ]);
  console.log('✅ Categories seeded:', cats.length);

  // Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'banner-outdoor-uv' },
      update: {},
      create: {
        name: 'Banner Outdoor UV', slug: 'banner-outdoor-uv',
        description: 'Banner outdoor cetak digital UV tahan cuaca, warna tajam dan tahan lama.',
        price: 35000, basePrice: 25000, pricingType: 'area_m2', pricingUnit: 'm²',
        categoryId: cats[0].id, isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'brosur-a4-full-color' },
      update: {},
      create: {
        name: 'Brosur A4 Full Color', slug: 'brosur-a4-full-color',
        description: 'Brosur A4 cetak full color dua sisi, kertas art paper 150gsm.',
        price: 1500, basePrice: 1500, pricingType: 'quantity', pricingUnit: 'lembar',
        categoryId: cats[1].id, isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'kartu-nama-premium' },
      update: {},
      create: {
        name: 'Kartu Nama Premium', slug: 'kartu-nama-premium',
        description: 'Kartu nama glossy/matte dengan cetak full color kedua sisi.',
        price: 85000, basePrice: 85000, pricingType: 'fixed',
        categoryId: cats[2].id, isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'stiker-vinyl-outdoor' },
      update: {},
      create: {
        name: 'Stiker Vinyl Outdoor', slug: 'stiker-vinyl-outdoor',
        description: 'Stiker vinyl tahan cuaca untuk keperluan luar ruangan.',
        price: 45000, basePrice: 35000, pricingType: 'area_m2', pricingUnit: 'm²',
        categoryId: cats[3].id, isFeatured: true,
      },
    }),
  ]);
  console.log('✅ Products seeded:', products.length);

  // Accounts
  const cashAccount = await prisma.account.upsert({
    where: { id: 'acc-kas-utama' }, update: {},
    create: { id: 'acc-kas-utama', name: 'Kas Utama', type: 'Cash', balance: 5000000 },
  });
  const bankAccount = await prisma.account.upsert({
    where: { id: 'acc-bca' }, update: {},
    create: { id: 'acc-bca', name: 'BCA Operasional', type: 'Bank', balance: 25000000 },
  });
  console.log('✅ Accounts seeded');

  // Raw materials
  await Promise.all([
    prisma.rawMaterial.upsert({ where: { id: 'mat-kertas-a4' }, update: {}, create: { id: 'mat-kertas-a4', name: 'Kertas A4 80gsm', unit: 'rim', stock: 50, minStock: 10, category: 'Kertas' } }),
    prisma.rawMaterial.upsert({ where: { id: 'mat-tinta-hitam' }, update: {}, create: { id: 'mat-tinta-hitam', name: 'Tinta Hitam', unit: 'liter', stock: 3, minStock: 2, category: 'Tinta' } }),
    prisma.rawMaterial.upsert({ where: { id: 'mat-vinyl' }, update: {}, create: { id: 'mat-vinyl', name: 'Vinyl Outdoor', unit: 'meter', stock: 100, minStock: 20, category: 'Media' } }),
    prisma.rawMaterial.upsert({ where: { id: 'mat-banner' }, update: {}, create: { id: 'mat-banner', name: 'Bahan Banner 440gsm', unit: 'meter', stock: 8, minStock: 15, category: 'Media' } }),
  ]);
  console.log('✅ Raw materials seeded');

  // Sample coupon
  await prisma.coupon.upsert({
    where: { code: 'FASTPRINT10' }, update: {},
    create: { code: 'FASTPRINT10', discountType: 'percentage', discountValue: 10, minOrderValue: 100000, enabled: true },
  });
  console.log('✅ Coupon seeded: FASTPRINT10');

  console.log('\n🎉 Database seeded successfully!');
  console.log('👤 Admin login: admin@fastprint.id / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
