import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

loadEnv({ path: ".env.local", override: false });

process.env.APP_URL ??= "http://localhost:3210";
process.env.BETTER_AUTH_SECRET ??= "test-secret-for-vitest";
process.env.BETTER_AUTH_URL ??= "http://localhost:3210";
process.env.JWT_SECRET ??= "test-jwt-secret-for-vitest";
process.env.PAYMENT_PROVIDER = "mock";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.STORAGE_PROVIDER = "local";

const TEST_PACKAGE_SLUG = "vitest-creator";
const createdEmails = new Set<string>();

async function modules() {
  const [
    { db },
    schema,
    credits,
    paymentsService,
    paymentProviderModule,
    rendersService,
  ] = await Promise.all([
    import("@/db"),
    import("@/db/schema"),
    import("@/lib/credits"),
    import("@/lib/payments/service"),
    import("@/lib/providers/payment"),
    import("@/lib/renders/service"),
  ]);

  return {
    db,
    ...schema,
    ...credits,
    ...paymentsService,
    ...paymentProviderModule,
    ...rendersService,
  };
}

async function createTestUser(email = `vitest-${randomUUID()}@renderai.test`) {
  const { db, user, userProfiles } = await modules();
  const id = `vitest-${randomUUID()}`;
  createdEmails.add(email);

  await db.insert(user).values({
    id,
    name: "Vitest User",
    email,
    emailVerified: true,
    role: "user",
    isDisabled: false,
  });
  await db.insert(userProfiles).values({
    userId: id,
    emailNotificationsEnabled: false,
  });

  return { id, email, name: "Vitest User" };
}

async function createTestProject(
  userId: string,
  name = `Vitest Project ${randomUUID()}`,
  opts: { archived?: boolean; isDefault?: boolean } = {},
) {
  const { db, projects } = await modules();
  const [project] = await db
    .insert(projects)
    .values({
      userId,
      name,
      isDefault: opts.isDefault ?? false,
      archivedAt: opts.archived ? new Date() : null,
    })
    .returning();
  return project;
}

async function createTestRenderWithAssets(params: {
  userId: string;
  projectId: string;
}) {
  const { db, renderAssets, renders } = await modules();
  const [render] = await db
    .insert(renders)
    .values({
      userId: params.userId,
      projectId: params.projectId,
      mode: "interior",
      prompt: "Vitest render prompt",
      outputFormat: "png",
      status: "success",
      creditsUsed: 1,
      completedAt: new Date(),
    })
    .returning();

  await db.insert(renderAssets).values([
    {
      renderId: render.id,
      userId: params.userId,
      projectId: params.projectId,
      type: "original",
      fileUrl: `http://localhost:3210/uploads/${render.id}/original.jpg`,
      fileKey: `vitest/${render.id}/original.jpg`,
      fileSize: 128,
      mimeType: "image/jpeg",
      width: 16,
      height: 9,
    },
    {
      renderId: render.id,
      userId: params.userId,
      projectId: params.projectId,
      type: "result",
      fileUrl: `http://localhost:3210/uploads/${render.id}/result.png`,
      fileKey: `vitest/${render.id}/result.png`,
      fileSize: 256,
      mimeType: "image/png",
      width: 16,
      height: 9,
    },
  ]);

  return render;
}

async function ensureTestPackage() {
  const { db, paymentPackages } = await modules();
  await db
    .insert(paymentPackages)
    .values({
      name: "Vitest Creator",
      slug: TEST_PACKAGE_SLUG,
      price: 10_000,
      currency: "IDR",
      credits: 10,
      bonusCredits: 2,
      isActive: true,
      sortOrder: 999,
    })
    .onConflictDoUpdate({
      target: paymentPackages.slug,
      set: {
        name: "Vitest Creator",
        price: 10_000,
        currency: "IDR",
        credits: 10,
        bonusCredits: 2,
        isActive: true,
        updatedAt: new Date(),
      },
    });
}

async function cleanupCreatedUsers() {
  const { db, user } = await modules();
  for (const email of createdEmails) {
    await db.delete(user).where(eq(user.email, email));
  }
  createdEmails.clear();
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL wajib tersedia untuk integration test.");
  }
  await ensureTestPackage();
});

afterEach(async () => {
  await cleanupCreatedUsers();
});

afterAll(async () => {
  const { db, dbClient, paymentPackages } = await import("@/db").then(
    async (dbModule) => ({
      ...dbModule,
      ...(await import("@/db/schema")),
    }),
  );
  await db.delete(paymentPackages).where(eq(paymentPackages.slug, TEST_PACKAGE_SLUG));
  await dbClient.end({ timeout: 5 });
});

describe("credits integration", () => {
  it("applies credit changes atomically and keeps idempotency", async () => {
    const {
      applyCreditChange,
      creditTransactions,
      db,
      getBalance,
    } = await modules();
    const testUser = await createTestUser();

    await expect(getBalance(testUser.id)).resolves.toBe(0);

    await expect(
      applyCreditChange({
        userId: testUser.id,
        type: "bonus",
        amount: 10,
        description: "Test bonus",
        idempotencyKey: `bonus:${testUser.id}`,
      }),
    ).resolves.toEqual({ applied: true, balance: 10 });

    await expect(
      applyCreditChange({
        userId: testUser.id,
        type: "usage",
        amount: -3,
        description: "Test render",
        idempotencyKey: `usage:${testUser.id}:render-1`,
      }),
    ).resolves.toEqual({ applied: true, balance: 7 });

    await expect(
      applyCreditChange({
        userId: testUser.id,
        type: "usage",
        amount: -3,
        description: "Duplicate render charge",
        idempotencyKey: `usage:${testUser.id}:render-1`,
      }),
    ).resolves.toEqual({ applied: false, balance: 7 });

    await expect(getBalance(testUser.id)).resolves.toBe(7);

    const transactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, testUser.id),
    });
    expect(transactions).toHaveLength(2);
  });

  it("rejects deductions that would make balance negative", async () => {
    const { applyCreditChange, getBalance, InsufficientCreditsError } =
      await modules();
    const testUser = await createTestUser();

    await expect(
      applyCreditChange({
        userId: testUser.id,
        type: "usage",
        amount: -1,
        description: "No balance render",
      }),
    ).rejects.toBeInstanceOf(InsufficientCreditsError);

    await expect(getBalance(testUser.id)).resolves.toBe(0);
  });
});

describe("payments integration", () => {
  it("creates mock checkout and credits paid webhooks idempotently", async () => {
    const {
      createCheckout,
      db,
      getBalance,
      handlePaymentNotification,
      notifications,
      paymentProvider,
      payments,
    } = await modules();
    const testUser = await createTestUser();

    const checkout = await createCheckout(testUser.id, TEST_PACKAGE_SLUG, {
      name: testUser.name,
      email: testUser.email,
    });

    expect(checkout.provider).toBe("mock");
    expect(checkout.redirectUrl).toContain("/payments/simulate");

    const pending = await db.query.payments.findFirst({
      where: eq(payments.providerOrderId, checkout.orderId),
    });
    expect(pending?.status).toBe("pending");

    const webhook = await paymentProvider().verifyAndParseWebhook({
      headers: {},
      body: {
        order_id: checkout.orderId,
        status_code: "200",
        gross_amount: "10000",
        transaction_id: `vitest-${randomUUID()}`,
        transaction_status: "settlement",
      },
    });

    await expect(handlePaymentNotification(webhook)).resolves.toEqual({
      handled: true,
      reason: "paid",
    });
    await expect(getBalance(testUser.id)).resolves.toBe(12);

    await expect(handlePaymentNotification(webhook)).resolves.toEqual({
      handled: true,
      reason: "already_paid",
    });
    await expect(getBalance(testUser.id)).resolves.toBe(12);

    const paid = await db.query.payments.findFirst({
      where: eq(payments.providerOrderId, checkout.orderId),
    });
    expect(paid?.status).toBe("paid");
    expect(paid?.paidAt).toBeInstanceOf(Date);

    const paymentNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, testUser.id),
    });
    expect(paymentNotifications).toHaveLength(1);
    expect(paymentNotifications[0]?.type).toBe("payment_success");
  });

  it("marks failed mock webhooks without crediting balance", async () => {
    const {
      createCheckout,
      db,
      getBalance,
      handlePaymentNotification,
      paymentProvider,
      payments,
    } = await modules();
    const testUser = await createTestUser();

    const checkout = await createCheckout(testUser.id, TEST_PACKAGE_SLUG, {
      name: testUser.name,
      email: testUser.email,
    });
    const webhook = await paymentProvider().verifyAndParseWebhook({
      headers: {},
      body: {
        order_id: checkout.orderId,
        status_code: "500",
        gross_amount: "10000",
        transaction_status: "failure",
      },
    });

    await expect(handlePaymentNotification(webhook)).resolves.toEqual({
      handled: true,
      reason: "failed",
    });
    await expect(getBalance(testUser.id)).resolves.toBe(0);

    const failed = await db.query.payments.findFirst({
      where: eq(payments.providerOrderId, checkout.orderId),
    });
    expect(failed?.status).toBe("failed");
    expect(failed?.failedAt).toBeInstanceOf(Date);
  });
});

describe("render project integration", () => {
  it("moves a render and its assets to another project owned by the user", async () => {
    const { db, moveRenderToProject, renderAssets, renders } = await modules();
    const testUser = await createTestUser();
    const sourceProject = await createTestProject(
      testUser.id,
      "Vitest Source Project",
    );
    const targetProject = await createTestProject(
      testUser.id,
      "Vitest Target Project",
    );
    const render = await createTestRenderWithAssets({
      userId: testUser.id,
      projectId: sourceProject.id,
    });

    await expect(
      moveRenderToProject(testUser.id, render.id, targetProject.id),
    ).resolves.toEqual({ ok: true, projectName: targetProject.name });

    const movedRender = await db.query.renders.findFirst({
      where: eq(renders.id, render.id),
    });
    expect(movedRender?.projectId).toBe(targetProject.id);

    const movedAssets = await db.query.renderAssets.findMany({
      where: eq(renderAssets.renderId, render.id),
    });
    expect(movedAssets).toHaveLength(2);
    expect(movedAssets.every((asset) => asset.projectId === targetProject.id)).toBe(
      true,
    );
  });

  it("rejects moving a render to another user's project or an archived project", async () => {
    const { db, moveRenderToProject, renderAssets, renders } = await modules();
    const testUser = await createTestUser();
    const otherUser = await createTestUser();
    const sourceProject = await createTestProject(
      testUser.id,
      "Vitest Source Project",
    );
    const otherProject = await createTestProject(
      otherUser.id,
      "Vitest Other User Project",
    );
    const archivedProject = await createTestProject(
      testUser.id,
      "Vitest Archived Project",
      { archived: true },
    );
    const render = await createTestRenderWithAssets({
      userId: testUser.id,
      projectId: sourceProject.id,
    });

    await expect(
      moveRenderToProject(testUser.id, render.id, otherProject.id),
    ).resolves.toEqual({ ok: false, reason: "project_not_found" });
    await expect(
      moveRenderToProject(testUser.id, render.id, archivedProject.id),
    ).resolves.toEqual({ ok: false, reason: "project_not_found" });

    const unchangedRender = await db.query.renders.findFirst({
      where: eq(renders.id, render.id),
    });
    expect(unchangedRender?.projectId).toBe(sourceProject.id);

    const unchangedAssets = await db.query.renderAssets.findMany({
      where: eq(renderAssets.renderId, render.id),
    });
    expect(unchangedAssets.every((asset) => asset.projectId === sourceProject.id))
      .toBe(true);
  });
});
