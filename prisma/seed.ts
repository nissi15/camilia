import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // ─── Clear existing data ──────────────────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.requestItem.deleteMany();
  await prisma.request.deleteMany();
  await prisma.processingStepOutput.deleteMany();
  await prisma.processingStep.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.yieldTarget.deleteMany();
  await prisma.parLevel.deleteMany();
  await prisma.requestTemplate.deleteMany();
  await prisma.telegramLink.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  // ─── Locations ────────────────────────────────────────────────────────────
  const warehouse = await prisma.location.create({
    data: { name: "Central Warehouse", type: "WAREHOUSE", address: "123 Industrial Blvd", phone: "555-0100" },
  });

  const restaurant1 = await prisma.location.create({
    data: { name: "Downtown Bistro", type: "RESTAURANT", address: "456 Main St", phone: "555-0201" },
  });

  const restaurant2 = await prisma.location.create({
    data: { name: "Uptown Grill", type: "RESTAURANT", address: "789 Oak Ave", phone: "555-0202" },
  });

  // ─── Suppliers ────────────────────────────────────────────────────────────
  const supplierMeat = await prisma.supplier.create({
    data: { name: "Premium Meats Co.", phone: "+250-788-001-001", notes: "Primary beef and pork supplier" },
  });
  const supplierPoultry = await prisma.supplier.create({
    data: { name: "Valley Poultry Farm", phone: "+250-788-002-002", notes: "Local chicken supplier" },
  });
  const supplierSeafood = await prisma.supplier.create({
    data: { name: "Ocean Fresh Seafood", phone: "+250-788-003-003", notes: "Fish and shrimp" },
  });
  const supplierFarms = await prisma.supplier.create({
    data: { name: "Local Farms Inc.", phone: "+250-788-004-004", notes: "Vegetables and produce" },
  });
  const supplierDairy = await prisma.supplier.create({
    data: { name: "Artisan Dairy Co.", phone: "+250-788-005-005", notes: "Cheese and butter" },
  });

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminPassword = await hash("admin123", 12);
  const chefPassword = await hash("chef123", 12);

  const admin = await prisma.user.create({
    data: { email: "admin@stocktrace.com", passwordHash: adminPassword, name: "Alex Manager", role: "WAREHOUSE_ADMIN", locationId: warehouse.id },
  });

  const chef1 = await prisma.user.create({
    data: { email: "chef@downtown.com", passwordHash: chefPassword, name: "Sam Chef", role: "RESTAURANT_STAFF", locationId: restaurant1.id },
  });

  const chef2 = await prisma.user.create({
    data: { email: "chef@uptown.com", passwordHash: chefPassword, name: "Jordan Cook", role: "RESTAURANT_STAFF", locationId: restaurant2.id },
  });

  // ─── Categories ───────────────────────────────────────────────────────────
  const meat = await prisma.category.create({ data: { name: "Meat" } });
  const beef = await prisma.category.create({ data: { name: "Beef", parentId: meat.id } });
  const ribeye = await prisma.category.create({ data: { name: "Ribeye", parentId: beef.id } });
  const sirloin = await prisma.category.create({ data: { name: "Sirloin", parentId: beef.id } });
  const poultry = await prisma.category.create({ data: { name: "Poultry", parentId: meat.id } });
  const chickenBreast = await prisma.category.create({ data: { name: "Chicken Breast", parentId: poultry.id } });
  const chickenThigh = await prisma.category.create({ data: { name: "Chicken Thigh", parentId: poultry.id } });
  const pork = await prisma.category.create({ data: { name: "Pork", parentId: meat.id } });
  const porkChop = await prisma.category.create({ data: { name: "Pork Chop", parentId: pork.id } });

  const seafood = await prisma.category.create({ data: { name: "Seafood" } });
  const salmon = await prisma.category.create({ data: { name: "Salmon", parentId: seafood.id } });
  const shrimp = await prisma.category.create({ data: { name: "Shrimp", parentId: seafood.id } });

  const vegetables = await prisma.category.create({ data: { name: "Vegetables" } });
  const tomatoes = await prisma.category.create({ data: { name: "Tomatoes", parentId: vegetables.id } });
  const onions = await prisma.category.create({ data: { name: "Onions", parentId: vegetables.id } });
  const potatoes = await prisma.category.create({ data: { name: "Potatoes", parentId: vegetables.id } });

  const dairy = await prisma.category.create({ data: { name: "Dairy" } });
  const cheese = await prisma.category.create({ data: { name: "Cheese", parentId: dairy.id } });
  const butter = await prisma.category.create({ data: { name: "Butter", parentId: dairy.id } });

  const dryGoods = await prisma.category.create({ data: { name: "Dry Goods" } });
  const spices = await prisma.category.create({ data: { name: "Spices" } });

  // ─── Yield Targets ────────────────────────────────────────────────────────
  await prisma.yieldTarget.createMany({
    data: [
      { categoryId: beef.id, stepType: "BUTCHER", targetPercent: 78 },
      { categoryId: poultry.id, stepType: "PORTION", targetPercent: 85 },
      { categoryId: pork.id, stepType: "BUTCHER", targetPercent: 80 },
      { categoryId: seafood.id, stepType: "PORTION", targetPercent: 88 },
    ],
  });

  // ─── Par Levels ──────────────────────────────────────────────────────────
  await prisma.parLevel.createMany({
    data: [
      { restaurantId: restaurant1.id, categoryId: beef.id, parQuantity: 5, unitLabel: "steak" },
      { restaurantId: restaurant1.id, categoryId: poultry.id, parQuantity: 8, unitLabel: "portion" },
      { restaurantId: restaurant1.id, categoryId: seafood.id, parQuantity: 4, unitLabel: "fillet" },
      { restaurantId: restaurant2.id, categoryId: beef.id, parQuantity: 4, unitLabel: "steak" },
      { restaurantId: restaurant2.id, categoryId: poultry.id, parQuantity: 6, unitLabel: "portion" },
    ],
  });

  // ─── Inventory Items + Processing (Full Lineage Demo) ─────────────────────

  // === ITEM 1: Ribeye Primal — full butcher → portion → package flow ===
  const ribeyePrimal = await prisma.inventoryItem.create({
    data: {
      batchCode: "RIB-2026-001",
      name: "Ribeye Primal",
      categoryId: ribeye.id,
      status: "PROCESSED",
      weightGrams: 2268, // 5 lb
      unitCount: 1,
      unitLabel: "primal",
      locationId: warehouse.id,
      supplierId: supplierMeat.id,
      supplier: "Premium Meats Co.",
      lotNumber: "PREM-20260316-A1",
      costRwf: 45000,
      receivedAt: daysAgo(7),
      expiresAt: daysAgo(-14),
      notes: "Grade A prime beef",
    },
  });

  // Receive step
  const receiveStep1 = await prisma.processingStep.create({
    data: {
      sourceItemId: ribeyePrimal.id,
      stepType: "RECEIVE",
      performedBy: admin.id,
      inputWeight: 2268,
      outputWeight: 2268,
      wasteWeight: 0,
      inputCount: 1,
      outputCount: 1,
      startedAt: daysAgo(7),
      completedAt: daysAgo(7),
    },
  });

  // Butcher step — cut primal into 4 steaks + waste
  const steak1 = await prisma.inventoryItem.create({
    data: {
      batchCode: "RIB-2026-001-S1",
      name: "Ribeye Steak #1",
      categoryId: ribeye.id,
      status: "PACKAGED",
      weightGrams: 454, // ~1 lb
      unitCount: 1,
      unitLabel: "steak",
      parentItemId: ribeyePrimal.id,
      rootItemId: ribeyePrimal.id,
      locationId: warehouse.id,
      receivedAt: daysAgo(7),
      expiresAt: daysAgo(-10),
    },
  });

  const steak2 = await prisma.inventoryItem.create({
    data: {
      batchCode: "RIB-2026-001-S2",
      name: "Ribeye Steak #2",
      categoryId: ribeye.id,
      status: "DISPATCHED",
      weightGrams: 468,
      unitCount: 1,
      unitLabel: "steak",
      parentItemId: ribeyePrimal.id,
      rootItemId: ribeyePrimal.id,
      locationId: warehouse.id,
      receivedAt: daysAgo(7),
      expiresAt: daysAgo(-10),
    },
  });

  const steak3 = await prisma.inventoryItem.create({
    data: {
      batchCode: "RIB-2026-001-S3",
      name: "Ribeye Steak #3",
      categoryId: ribeye.id,
      status: "DELIVERED",
      weightGrams: 440,
      unitCount: 1,
      unitLabel: "steak",
      parentItemId: ribeyePrimal.id,
      rootItemId: ribeyePrimal.id,
      locationId: warehouse.id,
      receivedAt: daysAgo(7),
      expiresAt: daysAgo(-10),
    },
  });

  const steak4 = await prisma.inventoryItem.create({
    data: {
      batchCode: "RIB-2026-001-S4",
      name: "Ribeye Steak #4",
      categoryId: ribeye.id,
      status: "PACKAGED",
      weightGrams: 460,
      unitCount: 1,
      unitLabel: "steak",
      parentItemId: ribeyePrimal.id,
      rootItemId: ribeyePrimal.id,
      locationId: warehouse.id,
      receivedAt: daysAgo(7),
      expiresAt: daysAgo(-10),
    },
  });

  const ribeyeWaste = await prisma.inventoryItem.create({
    data: {
      batchCode: "RIB-2026-001-W",
      name: "Ribeye Trim/Fat Waste",
      categoryId: ribeye.id,
      status: "WASTE",
      weightGrams: 446, // 2268 - 454 - 468 - 440 - 460 = 446
      unitCount: 1,
      unitLabel: "waste",
      parentItemId: ribeyePrimal.id,
      rootItemId: ribeyePrimal.id,
      locationId: warehouse.id,
      receivedAt: daysAgo(7),
    },
  });

  const butcherStep = await prisma.processingStep.create({
    data: {
      sourceItemId: ribeyePrimal.id,
      stepType: "BUTCHER",
      stepLabel: "Cut ribeye primal into steaks",
      performedBy: admin.id,
      inputWeight: 2268,
      outputWeight: 1822,
      wasteWeight: 446,
      inputCount: 1,
      outputCount: 4,
      notes: "Removed silver skin and excess fat",
      startedAt: daysAgo(6),
      completedAt: daysAgo(6),
    },
  });

  await prisma.processingStepOutput.createMany({
    data: [
      { processingStepId: butcherStep.id, outputItemId: steak1.id },
      { processingStepId: butcherStep.id, outputItemId: steak2.id },
      { processingStepId: butcherStep.id, outputItemId: steak3.id },
      { processingStepId: butcherStep.id, outputItemId: steak4.id },
      { processingStepId: butcherStep.id, outputItemId: ribeyeWaste.id },
    ],
  });

  // === ITEM 2: Chicken Breasts — received, partially processed ===
  const chickenBulk = await prisma.inventoryItem.create({
    data: {
      batchCode: "CHK-2026-001",
      name: "Chicken Breast Case",
      categoryId: chickenBreast.id,
      status: "PROCESSED",
      weightGrams: 4536, // 10 lb
      unitCount: 1,
      unitLabel: "case",
      locationId: warehouse.id,
      supplier: "Valley Poultry Farm",
      receivedAt: daysAgo(5),
      expiresAt: daysAgo(-5),
    },
  });

  await prisma.processingStep.create({
    data: {
      sourceItemId: chickenBulk.id,
      stepType: "RECEIVE",
      performedBy: admin.id,
      inputWeight: 4536,
      outputWeight: 4536,
      wasteWeight: 0,
      inputCount: 1,
      outputCount: 1,
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
    },
  });

  // Portion chicken into 8 portions + waste
  const chickenPortions = [];
  for (let i = 1; i <= 8; i++) {
    const status = i <= 4 ? "PACKAGED" : i <= 6 ? "DISPATCHED" : "PROCESSED";
    const portion = await prisma.inventoryItem.create({
      data: {
        batchCode: `CHK-2026-001-P${i}`,
        name: `Chicken Breast Portion #${i}`,
        categoryId: chickenBreast.id,
        status,
        weightGrams: 510 + Math.floor(Math.random() * 50),
        unitCount: 1,
        unitLabel: "portion",
        parentItemId: chickenBulk.id,
        rootItemId: chickenBulk.id,
        locationId: warehouse.id,
        receivedAt: daysAgo(5),
        expiresAt: daysAgo(-4),
      },
    });
    chickenPortions.push(portion);
  }

  const chickenWaste = await prisma.inventoryItem.create({
    data: {
      batchCode: "CHK-2026-001-W",
      name: "Chicken Trim Waste",
      categoryId: chickenBreast.id,
      status: "WASTE",
      weightGrams: 350,
      unitCount: 1,
      unitLabel: "waste",
      parentItemId: chickenBulk.id,
      rootItemId: chickenBulk.id,
      locationId: warehouse.id,
      receivedAt: daysAgo(5),
    },
  });

  const portionStep = await prisma.processingStep.create({
    data: {
      sourceItemId: chickenBulk.id,
      stepType: "PORTION",
      stepLabel: "Portion chicken breasts",
      performedBy: admin.id,
      inputWeight: 4536,
      outputWeight: 4186,
      wasteWeight: 350,
      inputCount: 1,
      outputCount: 8,
      notes: "Trimmed tendons and excess fat",
      startedAt: daysAgo(4),
      completedAt: daysAgo(4),
    },
  });

  for (const portion of chickenPortions) {
    await prisma.processingStepOutput.create({
      data: { processingStepId: portionStep.id, outputItemId: portion.id },
    });
  }
  await prisma.processingStepOutput.create({
    data: { processingStepId: portionStep.id, outputItemId: chickenWaste.id },
  });

  // === ITEM 3: Salmon — received, waiting to process ===
  const salmonFillet = await prisma.inventoryItem.create({
    data: {
      batchCode: "SAL-2026-001",
      name: "Atlantic Salmon Side",
      categoryId: salmon.id,
      status: "RECEIVED",
      weightGrams: 3175, // ~7 lb
      unitCount: 1,
      unitLabel: "side",
      locationId: warehouse.id,
      supplier: "Ocean Fresh Seafood",
      receivedAt: daysAgo(1),
      expiresAt: daysAgo(-3),
      notes: "Fresh, skin-on, pin bones removed",
    },
  });

  await prisma.processingStep.create({
    data: {
      sourceItemId: salmonFillet.id,
      stepType: "RECEIVE",
      performedBy: admin.id,
      inputWeight: 3175,
      outputWeight: 3175,
      wasteWeight: 0,
      inputCount: 1,
      outputCount: 1,
      startedAt: daysAgo(1),
      completedAt: daysAgo(1),
    },
  });

  // === ITEM 4: Pork Loin — received today ===
  const porkLoin = await prisma.inventoryItem.create({
    data: {
      batchCode: "PRK-2026-001",
      name: "Pork Loin",
      categoryId: porkChop.id,
      status: "RECEIVED",
      weightGrams: 2722, // ~6 lb
      unitCount: 1,
      unitLabel: "loin",
      locationId: warehouse.id,
      supplier: "Heritage Farms",
      receivedAt: hoursAgo(3),
      expiresAt: daysAgo(-7),
    },
  });

  await prisma.processingStep.create({
    data: {
      sourceItemId: porkLoin.id,
      stepType: "RECEIVE",
      performedBy: admin.id,
      inputWeight: 2722,
      outputWeight: 2722,
      wasteWeight: 0,
      inputCount: 1,
      outputCount: 1,
      startedAt: hoursAgo(3),
      completedAt: hoursAgo(3),
    },
  });

  // === ITEM 5: Sirloin — fully processed and delivered ===
  const sirloinPrimal = await prisma.inventoryItem.create({
    data: {
      batchCode: "SIR-2026-001",
      name: "Sirloin Primal",
      categoryId: sirloin.id,
      status: "PROCESSED",
      weightGrams: 3629, // ~8 lb
      unitCount: 1,
      unitLabel: "primal",
      locationId: warehouse.id,
      supplier: "Premium Meats Co.",
      receivedAt: daysAgo(10),
      expiresAt: daysAgo(-4),
    },
  });

  const sirloinSteaks = [];
  for (let i = 1; i <= 5; i++) {
    const steak = await prisma.inventoryItem.create({
      data: {
        batchCode: `SIR-2026-001-S${i}`,
        name: `Sirloin Steak #${i}`,
        categoryId: sirloin.id,
        status: "DELIVERED",
        weightGrams: 340 + Math.floor(Math.random() * 30),
        unitCount: 1,
        unitLabel: "steak",
        parentItemId: sirloinPrimal.id,
        rootItemId: sirloinPrimal.id,
        locationId: warehouse.id,
        receivedAt: daysAgo(10),
        expiresAt: daysAgo(-4),
      },
    });
    sirloinSteaks.push(steak);
  }

  const sirloinWaste = await prisma.inventoryItem.create({
    data: {
      batchCode: "SIR-2026-001-W",
      name: "Sirloin Fat/Trim Waste",
      categoryId: sirloin.id,
      status: "WASTE",
      weightGrams: 520,
      unitCount: 1,
      unitLabel: "waste",
      parentItemId: sirloinPrimal.id,
      rootItemId: sirloinPrimal.id,
      locationId: warehouse.id,
      receivedAt: daysAgo(10),
    },
  });

  const sirloinButcherStep = await prisma.processingStep.create({
    data: {
      sourceItemId: sirloinPrimal.id,
      stepType: "BUTCHER",
      stepLabel: "Cut sirloin into steaks",
      performedBy: admin.id,
      inputWeight: 3629,
      outputWeight: 3109,
      wasteWeight: 520,
      inputCount: 1,
      outputCount: 5,
      startedAt: daysAgo(9),
      completedAt: daysAgo(9),
    },
  });

  for (const s of sirloinSteaks) {
    await prisma.processingStepOutput.create({
      data: { processingStepId: sirloinButcherStep.id, outputItemId: s.id },
    });
  }
  await prisma.processingStepOutput.create({
    data: { processingStepId: sirloinButcherStep.id, outputItemId: sirloinWaste.id },
  });

  // === ITEM 6: Shrimp — received and packaged ===
  const shrimpBag = await prisma.inventoryItem.create({
    data: {
      batchCode: "SHR-2026-001",
      name: "Jumbo Shrimp Bag",
      categoryId: shrimp.id,
      status: "PACKAGED",
      weightGrams: 907, // 2 lb
      unitCount: 24,
      unitLabel: "shrimp",
      locationId: warehouse.id,
      supplier: "Ocean Fresh Seafood",
      receivedAt: daysAgo(3),
      expiresAt: daysAgo(-4),
    },
  });

  // === ITEM 7: Tomatoes ===
  const tomatoBox = await prisma.inventoryItem.create({
    data: {
      batchCode: "TOM-2026-001",
      name: "Roma Tomatoes",
      categoryId: tomatoes.id,
      status: "RECEIVED",
      weightGrams: 4536, // 10 lb
      unitCount: 30,
      unitLabel: "tomato",
      locationId: warehouse.id,
      supplier: "Local Farms Inc.",
      receivedAt: daysAgo(2),
      expiresAt: daysAgo(-5),
    },
  });

  // === ITEM 8: Potatoes ===
  const potatoBag = await prisma.inventoryItem.create({
    data: {
      batchCode: "POT-2026-001",
      name: "Russet Potatoes",
      categoryId: potatoes.id,
      status: "RECEIVED",
      weightGrams: 9072, // 20 lb
      unitCount: 40,
      unitLabel: "potato",
      locationId: warehouse.id,
      supplier: "Local Farms Inc.",
      receivedAt: daysAgo(2),
      expiresAt: daysAgo(-14),
    },
  });

  // === ITEM 9: Cheese block ===
  const cheeseBlock = await prisma.inventoryItem.create({
    data: {
      batchCode: "CHS-2026-001",
      name: "Aged Cheddar Block",
      categoryId: cheese.id,
      status: "RECEIVED",
      weightGrams: 2268, // 5 lb
      unitCount: 1,
      unitLabel: "block",
      locationId: warehouse.id,
      supplier: "Artisan Dairy Co.",
      receivedAt: daysAgo(1),
      expiresAt: daysAgo(-30),
    },
  });

  // === ITEM 10: Onions ===
  await prisma.inventoryItem.create({
    data: {
      batchCode: "ONI-2026-001",
      name: "Yellow Onions",
      categoryId: onions.id,
      status: "RECEIVED",
      weightGrams: 4536, // 10 lb
      unitCount: 15,
      unitLabel: "onion",
      locationId: warehouse.id,
      supplier: "Local Farms Inc.",
      receivedAt: daysAgo(3),
      expiresAt: daysAgo(-21),
    },
  });

  // ─── Requests ─────────────────────────────────────────────────────────────

  // Request 1: DELIVERED — Downtown Bistro got their steaks
  const req1 = await prisma.request.create({
    data: {
      requestNumber: "REQ-2026-0001",
      requestedBy: chef1.id,
      restaurantId: restaurant1.id,
      status: "DELIVERED",
      priority: "HIGH",
      notes: "Needed for weekend dinner service",
      requestedAt: daysAgo(8),
      packedAt: daysAgo(7),
      dispatchedAt: daysAgo(6),
      deliveredAt: daysAgo(6),
    },
  });

  await prisma.requestItem.createMany({
    data: [
      { requestId: req1.id, categoryId: ribeye.id, description: "Ribeye Steaks", quantity: 2, unitLabel: "steak", fulfilledItemId: steak2.id, status: "FULFILLED" },
      { requestId: req1.id, categoryId: ribeye.id, description: "Ribeye Steaks", quantity: 1, unitLabel: "steak", fulfilledItemId: steak3.id, status: "FULFILLED" },
    ],
  });

  // Request 2: DISPATCHED — Uptown Grill order on the way
  const req2 = await prisma.request.create({
    data: {
      requestNumber: "REQ-2026-0002",
      requestedBy: chef2.id,
      restaurantId: restaurant2.id,
      status: "DISPATCHED",
      priority: "NORMAL",
      notes: "Regular weekly order",
      requestedAt: daysAgo(3),
      packedAt: daysAgo(2),
      dispatchedAt: daysAgo(1),
    },
  });

  await prisma.requestItem.createMany({
    data: [
      { requestId: req2.id, categoryId: sirloin.id, description: "Sirloin Steaks", quantity: 3, unitLabel: "steak", status: "FULFILLED" },
      { requestId: req2.id, categoryId: chickenBreast.id, description: "Chicken Breast Portions", quantity: 4, unitLabel: "portion", status: "FULFILLED" },
    ],
  });

  // Request 3: PENDING — Downtown Bistro new request
  const req3 = await prisma.request.create({
    data: {
      requestNumber: "REQ-2026-0003",
      requestedBy: chef1.id,
      restaurantId: restaurant1.id,
      status: "PENDING",
      priority: "URGENT",
      notes: "Running low on protein, need ASAP",
      requestedAt: hoursAgo(6),
    },
  });

  await prisma.requestItem.createMany({
    data: [
      { requestId: req3.id, categoryId: chickenBreast.id, description: "Chicken Breast Portions", quantity: 6, unitLabel: "portion", status: "PENDING" },
      { requestId: req3.id, categoryId: salmon.id, description: "Salmon Fillets", quantity: 4, unitLabel: "fillet", status: "PENDING" },
      { requestId: req3.id, categoryId: shrimp.id, description: "Jumbo Shrimp", quantity: 12, unitLabel: "shrimp", status: "PENDING" },
    ],
  });

  // Request 4: PACKING — Uptown Grill being prepared
  const req4 = await prisma.request.create({
    data: {
      requestNumber: "REQ-2026-0004",
      requestedBy: chef2.id,
      restaurantId: restaurant2.id,
      status: "PACKING",
      priority: "NORMAL",
      requestedAt: daysAgo(1),
      packedAt: hoursAgo(2),
    },
  });

  await prisma.requestItem.createMany({
    data: [
      { requestId: req4.id, categoryId: porkChop.id, description: "Pork Chops", quantity: 8, unitLabel: "chop", status: "PENDING" },
      { requestId: req4.id, categoryId: tomatoes.id, description: "Roma Tomatoes", quantity: 10, unitLabel: "tomato", status: "FULFILLED" },
    ],
  });

  // Request 5: PENDING — Downtown Bistro vegetables
  const req5 = await prisma.request.create({
    data: {
      requestNumber: "REQ-2026-0005",
      requestedBy: chef1.id,
      restaurantId: restaurant1.id,
      status: "PENDING",
      priority: "LOW",
      notes: "For next week prep",
      requestedAt: hoursAgo(1),
    },
  });

  await prisma.requestItem.createMany({
    data: [
      { requestId: req5.id, categoryId: potatoes.id, description: "Russet Potatoes", quantity: 20, unitLabel: "potato", status: "PENDING" },
      { requestId: req5.id, categoryId: onions.id, description: "Yellow Onions", quantity: 8, unitLabel: "onion", status: "PENDING" },
      { requestId: req5.id, categoryId: cheese.id, description: "Cheddar Cheese", quantity: 1, unitLabel: "block", status: "PENDING" },
    ],
  });

  // Request 6: CANCELLED
  await prisma.request.create({
    data: {
      requestNumber: "REQ-2026-0006",
      requestedBy: chef2.id,
      restaurantId: restaurant2.id,
      status: "CANCELLED",
      priority: "NORMAL",
      notes: "Menu changed, no longer needed",
      requestedAt: daysAgo(5),
    },
  });

  // ─── Conversations & Messages ─────────────────────────────────────────────

  const convo1 = await prisma.conversation.create({
    data: { restaurantId: restaurant1.id, warehouseId: warehouse.id },
  });

  const convo2 = await prisma.conversation.create({
    data: { restaurantId: restaurant2.id, warehouseId: warehouse.id },
  });

  // Conversation 1: Downtown Bistro ↔ Warehouse
  await prisma.message.createMany({
    data: [
      { conversationId: convo1.id, senderId: chef1.id, content: "Hi, we're running low on ribeye steaks. Can we get 3 more by Friday?", createdAt: daysAgo(8), readAt: daysAgo(8) },
      { conversationId: convo1.id, senderId: admin.id, content: "Sure! I just received a fresh primal today. I'll have them butchered and ready by Thursday.", createdAt: daysAgo(8), readAt: daysAgo(8) },
      { conversationId: convo1.id, senderId: chef1.id, content: "Perfect, thanks! Can you make them about 1 lb each?", createdAt: daysAgo(8), readAt: daysAgo(8) },
      { conversationId: convo1.id, senderId: admin.id, content: "Will do. I'll submit the dispatch once they're packaged.", createdAt: daysAgo(7), readAt: daysAgo(7) },
      { conversationId: convo1.id, senderId: admin.id, content: "Your order REQ-2026-0001 has been dispatched! Should arrive this afternoon.", createdAt: daysAgo(6), readAt: daysAgo(6) },
      { conversationId: convo1.id, senderId: chef1.id, content: "Received everything, steaks look great! 👍", createdAt: daysAgo(6), readAt: daysAgo(6) },
      { conversationId: convo1.id, senderId: chef1.id, content: "Hey, I just submitted a new urgent request (REQ-2026-0003). We need chicken and salmon ASAP for tonight's service.", createdAt: hoursAgo(6), readAt: hoursAgo(5) },
      { conversationId: convo1.id, senderId: admin.id, content: "Got it, I see the request. We have chicken portions ready. The salmon just came in yesterday — I'll start portioning it now.", createdAt: hoursAgo(5), readAt: hoursAgo(4) },
      { conversationId: convo1.id, senderId: chef1.id, content: "How soon can you have it dispatched?", createdAt: hoursAgo(4) },
      { conversationId: convo1.id, senderId: admin.id, content: "Should be ready within the hour. I'll update the request status.", createdAt: hoursAgo(3) },
    ],
  });

  // Conversation 2: Uptown Grill ↔ Warehouse
  await prisma.message.createMany({
    data: [
      { conversationId: convo2.id, senderId: chef2.id, content: "Good morning! Just placed our weekly order.", createdAt: daysAgo(3), readAt: daysAgo(3) },
      { conversationId: convo2.id, senderId: admin.id, content: "Got it! I'll start packing the sirloin and chicken. Should be dispatched tomorrow.", createdAt: daysAgo(3), readAt: daysAgo(3) },
      { conversationId: convo2.id, senderId: admin.id, content: "Your order is dispatched (REQ-2026-0002). ETA 2 hours.", createdAt: daysAgo(1), readAt: daysAgo(1) },
      { conversationId: convo2.id, senderId: chef2.id, content: "Thanks! Also wanted to ask — do you have any pork chops available? We're adding a new dish.", createdAt: daysAgo(1), readAt: daysAgo(1) },
      { conversationId: convo2.id, senderId: admin.id, content: "We just got a pork loin in today. I can cut chops for you. Submit a request and I'll prioritize it.", createdAt: daysAgo(1), readAt: hoursAgo(12) },
      { conversationId: convo2.id, senderId: chef2.id, content: "Done! Just submitted REQ-2026-0004 for pork chops and some tomatoes.", createdAt: daysAgo(1) },
    ],
  });

  // ─── Notifications ───────────────────────────────────────────────────────

  await prisma.notification.createMany({
    data: [
      // Warehouse admin notifications
      {
        userId: admin.id,
        type: "REQUEST_CREATED",
        title: "New Request",
        body: "Downtown Bistro submitted REQ-2026-0003 (URGENT priority)",
        href: `/requests/${req3.id}`,
        createdAt: hoursAgo(6),
      },
      {
        userId: admin.id,
        type: "REQUEST_CREATED",
        title: "New Request",
        body: "Uptown Grill submitted REQ-2026-0004 (NORMAL priority)",
        href: `/requests/${req4.id}`,
        createdAt: daysAgo(1),
        readAt: daysAgo(1),
      },
      {
        userId: admin.id,
        type: "REQUEST_CREATED",
        title: "New Request",
        body: "Downtown Bistro submitted REQ-2026-0005 (LOW priority)",
        href: `/requests/${req5.id}`,
        createdAt: hoursAgo(1),
      },
      {
        userId: admin.id,
        type: "EXPIRY_WARNING",
        title: "Expiry Alert",
        body: "Chicken Breast Case (CHK-2026-001) expires in 5 days",
        href: `/inventory/${chickenBulk.id}`,
        createdAt: hoursAgo(12),
      },
      {
        userId: admin.id,
        type: "EXPIRY_WARNING",
        title: "Expiry Alert",
        body: "Atlantic Salmon Side (SAL-2026-001) expires in 3 days",
        href: `/inventory/${salmonFillet.id}`,
        createdAt: hoursAgo(8),
      },
      {
        userId: admin.id,
        type: "DELIVERY_CONFIRMED",
        title: "Delivery Confirmed",
        body: "Downtown Bistro confirmed delivery of REQ-2026-0001",
        href: `/requests/${req1.id}`,
        createdAt: daysAgo(6),
        readAt: daysAgo(6),
      },
      {
        userId: admin.id,
        type: "NEW_MESSAGE",
        title: "New Message",
        body: "Sam Chef: How soon can you have it dispatched?",
        href: "/messages",
        createdAt: hoursAgo(4),
      },
      // Restaurant staff notifications
      {
        userId: chef1.id,
        type: "REQUEST_STATUS_CHANGED",
        title: "Request dispatched",
        body: "REQ-2026-0001 has been dispatched",
        href: `/my-requests/${req1.id}`,
        createdAt: daysAgo(6),
        readAt: daysAgo(6),
      },
      {
        userId: chef1.id,
        type: "REQUEST_STATUS_CHANGED",
        title: "Request delivered",
        body: "REQ-2026-0001 has been delivered",
        href: `/my-requests/${req1.id}`,
        createdAt: daysAgo(6),
        readAt: daysAgo(6),
      },
      {
        userId: chef2.id,
        type: "REQUEST_STATUS_CHANGED",
        title: "Request dispatched",
        body: "REQ-2026-0002 has been dispatched",
        href: `/my-requests/${req2.id}`,
        createdAt: daysAgo(1),
      },
      {
        userId: chef2.id,
        type: "REQUEST_STATUS_CHANGED",
        title: "Request is being packed",
        body: "REQ-2026-0004 is being packed",
        href: `/my-requests/${req4.id}`,
        createdAt: hoursAgo(2),
      },
      {
        userId: chef1.id,
        type: "NEW_MESSAGE",
        title: "New Message",
        body: "Alex Manager: Should be ready within the hour.",
        href: "/messages",
        createdAt: hoursAgo(3),
      },
    ],
  });

  console.log("Seed complete!");
  console.log("  - 3 locations (1 warehouse, 2 restaurants)");
  console.log("  - 3 users (1 admin, 2 chefs)");
  console.log("  - 20 categories");
  console.log("  - 25+ inventory items with full lineage");
  console.log("  - 6 requests (various statuses)");
  console.log("  - 16 chat messages across 2 conversations");
  console.log("  - 12 notifications");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
