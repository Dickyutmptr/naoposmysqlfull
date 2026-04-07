const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 0. Users (Admin, Kitchen, Cashier)
  const users = [
    { username: 'arfi', password: 'arfi123', name: 'Arfi', role: 'admin' },
    { username: 'naufal', password: '123', name: 'Naufal', role: 'kitchen' },
    { username: 'dup', password: '123', name: 'DUP', role: 'cashier' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: u.password, role: u.role, name: u.name },
      create: { username: u.username, password: u.password, role: u.role, name: u.name },
    });
  }
  console.log('Users seeded: Arfi, Naufal, DUP');

  // 1. Categories
  const categories = [
    { name: 'Makanan' },
    { name: 'Coffee Series' },
    { name: 'Coconut Series' },
    { name: 'Matcha Series' },
    { name: 'Chocolate Series' },
    { name: 'Cemilan' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log('Categories seeded.')

  // 2. Ingredients (Bahan Baku)
  const ingredients = [
    { name: 'Kopi Beans', stock: 5000, unit: 'gr' },
    { name: 'Susu Cair', stock: 10000, unit: 'ml' },
    { name: 'Gula Aren', stock: 3000, unit: 'ml' },
    { name: 'Matcha Powder', stock: 1000, unit: 'gr' },
    { name: 'Red Velvet Powder', stock: 1000, unit: 'gr' },
    { name: 'Sirup Bubble Gum', stock: 2000, unit: 'ml' },
    { name: 'Nasi', stock: 10000, unit: 'gr' },
    { name: 'Ayam', stock: 5000, unit: 'gr' },
    { name: 'Telur', stock: 100, unit: 'pcs' },
    { name: 'Kentang', stock: 3000, unit: 'gr' },
  ]

  for (const ing of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: ing,
    })
  }
  console.log('Ingredients seeded.')

  // Helper to find ID
  const getCatId = async (name) => {
    const cat = await prisma.category.findUnique({ where: { name } })
    return cat.id
  }
  const getIngId = async (name) => {
    const ing = await prisma.ingredient.findUnique({ where: { name } })
    return ing.id
  }

  // 3. Products & Recipes
  const products = [
    {
      name: 'Kopi Susu Gula Aren',
      price: 18000,
      category: 'coffee',
      image: 'https://cdn-icons-png.flaticon.com/512/751/751621.png',
      recipe: [
        { ingredient: 'Kopi Beans', amount: 18 },
        { ingredient: 'Susu Cair', amount: 100 },
        { ingredient: 'Gula Aren', amount: 20 }
      ]
    },
    {
      name: 'Americano',
      price: 15000,
      category: 'coffee',
      image: 'https://cdn-icons-png.flaticon.com/512/924/924514.png',
      recipe: [
        { ingredient: 'Kopi Beans', amount: 18 }
      ]
    },
    {
      name: 'Matcha Latte',
      price: 18000,
      category: 'non-coffee',
      image: 'https://cdn-icons-png.flaticon.com/512/2738/2738097.png',
      recipe: [
        { ingredient: 'Matcha Powder', amount: 15 },
        { ingredient: 'Susu Cair', amount: 120 }
      ]
    },
    {
      name: 'Nasi Goreng Spesial',
      price: 25000,
      category: 'makanan',
      image: 'https://cdn-icons-png.flaticon.com/512/706/706164.png',
      recipe: [
        { ingredient: 'Nasi', amount: 200 },
        { ingredient: 'Telur', amount: 1 },
        { ingredient: 'Ayam', amount: 50 }
      ]
    },
    {
      name: 'French Fries',
      price: 18000,
      category: 'cemilan',
      image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
      recipe: [
        { ingredient: 'Kentang', amount: 150 }
      ]
    }
  ]

  for (const prod of products) {
    const catId = await getCatId(prod.category)

    // Find or Create Product
    let product = await prisma.product.findFirst({
      where: { name: prod.name }
    })

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: prod.name,
          price: prod.price,
          categoryId: catId,
          image: prod.image
        }
      })
    } else {
      // Update if exists
      product = await prisma.product.update({
        where: { id: product.id },
        data: {
          price: prod.price,
          categoryId: catId,
          image: prod.image
        }
      })
    }

    // Update Recipe: Clear old, Add new
    await prisma.recipe.deleteMany({ where: { productId: product.id } })

    for (const item of prod.recipe) {
      const ingId = await getIngId(item.ingredient)
      if (ingId) {
        await prisma.recipe.create({
          data: {
            productId: product.id,
            ingredientId: ingId,
            amount: item.amount
          }
        })
      }
    }
  }

  console.log('Products & Recipes seeded.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
