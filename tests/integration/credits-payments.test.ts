import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

loadEnv({ path: ".env.local", override: false });

process.env.APP_URL ??= "http://localhost:3210";
process.env.AI_PROVIDER = "mock";
process.env.BETTER_AUTH_SECRET ??= "test-secret-for-vitest";
process.env.BETTER_AUTH_URL ??= "http://localhost:3210";
process.env.JWT_SECRET ??= "test-jwt-secret-for-vitest";
process.env.JOB_LOCK_TIMEOUT_SECONDS = "300";
process.env.PAYMENT_PROVIDER = "mock";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.RENDER_PROCESSING_MODE = "worker";
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
    storageModule,
  ] = await Promise.all([
    import("@/db"),
    import("@/db/schema"),
    import("@/lib/credits"),
    import("@/lib/payments/service"),
    import("@/lib/providers/payment"),
    import("@/lib/renders/service"),
    import("@/lib/storage"),
  ]);

  return {
    db,
    ...schema,
    ...credits,
    ...paymentsService,
    ...paymentProviderModule,
    ...rendersService,
    ...storageModule,
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
  const { db, renderAssets, storage, user } = await modules();
  for (const email of createdEmails) {
    const existing = await db.query.user.findFirst({
      where: eq(user.email, email),
    });
    if (existing) {
      const assets = await db.query.renderAssets.findMany({
        where: eq(renderAssets.userId, existing.id),
      });
      for (const asset of assets) {
        await storage().deleteObject(asset.fileKey);
      }
    }
    await db.delete(user).where(eq(user.email, email));
  }
  createdEmails.clear();
}

async function createUploadedImage(fileName = "vitest-original.png") {
  const sharp = (await import("sharp")).default;
  const data = await sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 180, g: 190, b: 200 },
    },
  })
    .png()
    .toBuffer();

  return {
    data,
    contentType: "image/png",
    ext: "png",
    fileName,
    size: data.length,
    width: 8,
    height: 8,
  };
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

  it("recovers credits when a paid webhook retry finds missing credit transaction", async () => {
    const {
      createCheckout,
      creditTransactions,
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

    const payment = await db.query.payments.findFirst({
      where: eq(payments.providerOrderId, checkout.orderId),
    });
    expect(payment).toBeTruthy();

    await db
      .update(payments)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(payments.id, payment!.id));

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
      reason: "credited_after_paid",
    });
    await expect(getBalance(testUser.id)).resolves.toBe(12);

    await expect(handlePaymentNotification(webhook)).resolves.toEqual({
      handled: true,
      reason: "already_paid",
    });
    await expect(getBalance(testUser.id)).resolves.toBe(12);

    const transactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.paymentId, payment!.id),
    });
    expect(transactions).toHaveLength(1);

    const paymentNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, testUser.id),
    });
    expect(paymentNotifications).toHaveLength(1);
    expect(paymentNotifications[0]?.type).toBe("payment_success");
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

describe("render workflow integration", () => {
  it("enqueues a render, reserves credit, and completes it through the worker", async () => {
    const {
      applyCreditChange,
      createRender,
      db,
      getBalance,
      notifications,
      processRenderJob,
      projects,
      renderAssets,
      renderJobs,
      renders,
    } = await modules();
    const testUser = await createTestUser();
    const project = await createTestProject(
      testUser.id,
      "Vitest Render Workflow Project",
    );
    await applyCreditChange({
      userId: testUser.id,
      type: "bonus",
      amount: 5,
      description: "Render workflow test credit",
      idempotencyKey: `workflow-credit:${testUser.id}`,
    });

    const created = await createRender({
      userId: testUser.id,
      projectId: project.id,
      mode: "interior",
      prompt: "Vitest render workflow prompt",
      outputFormat: "png",
      original: await createUploadedImage(),
    });

    expect(created.status).toBe("queued");
    expect(created.balance).toBe(4);
    await expect(getBalance(testUser.id)).resolves.toBe(4);

    const queuedJob = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.renderId, created.renderId),
    });
    expect(queuedJob?.status).toBe("queued");

    await expect(
      processRenderJob(created.renderId, "vitest-worker"),
    ).resolves.toEqual({
      processed: true,
      renderId: created.renderId,
      status: "success",
    });

    const completedRender = await db.query.renders.findFirst({
      where: eq(renders.id, created.renderId),
    });
    expect(completedRender?.status).toBe("success");
    expect(completedRender?.creditsUsed).toBe(1);
    expect(completedRender?.completedAt).toBeInstanceOf(Date);

    const completedJob = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.renderId, created.renderId),
    });
    expect(completedJob?.status).toBe("success");

    const assets = await db.query.renderAssets.findMany({
      where: eq(renderAssets.renderId, created.renderId),
    });
    expect(assets.some((asset) => asset.type === "original")).toBe(true);
    expect(assets.some((asset) => asset.type === "result")).toBe(true);

    const updatedProject = await db.query.projects.findFirst({
      where: eq(projects.id, project.id),
    });
    expect(updatedProject?.coverImageUrl).toBeTruthy();

    const renderNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, testUser.id),
    });
    expect(renderNotifications.some((note) => note.type === "render_success")).toBe(
      true,
    );
    await expect(getBalance(testUser.id)).resolves.toBe(4);
  });

  it("recovers stale processing jobs before a worker claims the next job", async () => {
    const {
      applyCreditChange,
      createRender,
      db,
      processNextRenderJob,
      renderJobs,
      renders,
    } = await modules();
    const testUser = await createTestUser();
    const project = await createTestProject(
      testUser.id,
      "Vitest Stale Worker Project",
    );
    await applyCreditChange({
      userId: testUser.id,
      type: "bonus",
      amount: 2,
      description: "Stale worker test credit",
      idempotencyKey: `stale-worker-credit:${testUser.id}`,
    });

    const created = await createRender({
      userId: testUser.id,
      projectId: project.id,
      mode: "interior",
      prompt: "Vitest stale worker prompt",
      outputFormat: "png",
      original: await createUploadedImage("vitest-stale-original.png"),
    });

    const lockedAt = new Date(Date.now() - 301_000);
    await db
      .update(renderJobs)
      .set({
        status: "processing",
        attempts: 1,
        lockedAt,
        lockedBy: "dead-vitest-worker",
      })
      .where(eq(renderJobs.renderId, created.renderId));
    await db
      .update(renders)
      .set({ status: "processing", startedAt: lockedAt })
      .where(eq(renders.id, created.renderId));

    await expect(processNextRenderJob("vitest-worker")).resolves.toEqual({
      processed: true,
      renderId: created.renderId,
      status: "success",
    });

    const completedJob = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.renderId, created.renderId),
    });
    expect(completedJob?.status).toBe("success");
    expect(completedJob?.lockedBy).toBeNull();

    const completedRender = await db.query.renders.findFirst({
      where: eq(renders.id, created.renderId),
    });
    expect(completedRender?.status).toBe("success");
    expect(completedRender?.errorCode).toBeNull();
  });
});

describe("notifications email routing", () => {
  it("emails transactional events (payment) but keeps render/credit in-app only", async () => {
    const { db, emailLogs, notifications } = await modules();
    const { notifyUser } = await import("@/lib/notifications/service");
    const testUser = await createTestUser();

    // Payment: carries an email payload -> must always send (email_logs row).
    await notifyUser({
      userId: testUser.id,
      type: "payment_success",
      title: "Pembayaran berhasil",
      email: { subject: "Pembayaran berhasil", html: "<p>ok</p>" },
    });

    // Render / low-credit: no email payload -> in-app notification only.
    await notifyUser({
      userId: testUser.id,
      type: "render_success",
      title: "Render selesai",
    });
    await notifyUser({
      userId: testUser.id,
      type: "low_credit",
      title: "Kredit menipis",
    });

    const notes = await db.query.notifications.findMany({
      where: eq(notifications.userId, testUser.id),
    });
    expect(notes).toHaveLength(3);

    const emails = await db.query.emailLogs.findMany({
      where: eq(emailLogs.userId, testUser.id),
    });
    expect(emails).toHaveLength(1);
    expect(emails[0]?.type).toBe("payment_success");
  });
});

describe("render failure refund", () => {
  it("refunds the reserved credit and notifies in-app (no email) on final failure", async () => {
    const {
      applyCreditChange,
      createRender,
      db,
      emailLogs,
      getBalance,
      notifications,
      renderJobs,
      renders,
    } = await modules();
    const { finalizeFailedRender } = await import("@/lib/renders/jobs");
    const testUser = await createTestUser();
    const project = await createTestProject(testUser.id, "Vitest Failure Project");
    await applyCreditChange({
      userId: testUser.id,
      type: "bonus",
      amount: 3,
      description: "Failure test credit",
      idempotencyKey: `fail-credit:${testUser.id}`,
    });

    const created = await createRender({
      userId: testUser.id,
      projectId: project.id,
      mode: "interior",
      prompt: "Vitest failure prompt",
      outputFormat: "png",
      original: await createUploadedImage("vitest-fail-original.png"),
    });
    // 1 credit reserved at enqueue.
    expect(created.balance).toBe(2);
    await expect(getBalance(testUser.id)).resolves.toBe(2);

    const job = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.renderId, created.renderId),
    });

    await finalizeFailedRender({
      renderId: created.renderId,
      userId: testUser.id,
      jobId: job!.id,
      message: "boom",
      code: "TEST_FAIL",
    });

    // Reserved credit is returned.
    await expect(getBalance(testUser.id)).resolves.toBe(3);

    const failedRender = await db.query.renders.findFirst({
      where: eq(renders.id, created.renderId),
    });
    expect(failedRender?.status).toBe("failed");
    expect(failedRender?.errorCode).toBe("TEST_FAIL");

    const failedJob = await db.query.renderJobs.findFirst({
      where: eq(renderJobs.renderId, created.renderId),
    });
    expect(failedJob?.status).toBe("failed");

    const notes = await db.query.notifications.findMany({
      where: eq(notifications.userId, testUser.id),
    });
    expect(notes.some((note) => note.type === "render_failed")).toBe(true);

    // Render failures are in-app only.
    const emails = await db.query.emailLogs.findMany({
      where: eq(emailLogs.userId, testUser.id),
    });
    expect(emails).toHaveLength(0);
  });
});
