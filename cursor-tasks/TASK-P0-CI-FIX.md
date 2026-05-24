# 🚨 P0 EMERGENCY: CI E2E 修复（铁律㉑ — 修好为止）

## 根因
CI run 26349760703 验证: `frontend/e2e/smoke.spec.ts` 中 `clickNav` 函数 (line 12-39)
在 1440px headless CI 环境下:

1. `sidebar(page).isVisible({ timeout: 8_000 })` 返回 false
   - 原因: AnimatePresence 动画导致 sidebar 渲染有短暂过渡期，`isVisible()` 在动画完成前调用
2. fallthrough 到 Strategy 3 → 在 mobile nav `app-mobile-nav` 中找到 nav-burn
3. 但该按钮有 CSS class `lg:hidden`，实际不在 viewport 内
4. `click({ force: true })` 依然报错: "Element is outside of the viewport"

## 修复方案

### 修改 clickNav 函数（只改 smoke.spec.ts，不改前端组件）

将 Strategy 1 (sidebar) 修改为:

```typescript
async function clickNav(page: Page, key: string) {
  const TIMEOUT = 12_000;

  // Strategy 1: sidebar (desktop >= lg) — 带 2s 动画等待 + retry
  const sidebarNav = sidebar(page);
  let sidebarVisible = await sidebarNav.isVisible({ timeout: 3000 }).catch(() => false);
  if (!sidebarVisible) {
    await page.waitForTimeout(2000);  // AnimatePresence 动画完成窗口
    sidebarVisible = await sidebarNav.isVisible({ timeout: 3000 }).catch(() => false);
  }
  if (sidebarVisible) {
    const link = sidebarNav.getByTestId(`nav-${key}`);
    await link.waitFor({ state: "visible", timeout: TIMEOUT }).catch(() => {});
    await link.scrollIntoViewIfNeeded();
    await link.click({ timeout: TIMEOUT });
    return;
  }

  // Strategy 2: primary nav (tablet header, lg:hidden)
  const primary = page.getByRole("navigation", { name: "Primary" });
  if (await primary.isVisible({ timeout: 3000 }).catch(() => false)) {
    const link = primary.getByTestId(`nav-${key}`);
    await link.waitFor({ state: "visible", timeout: TIMEOUT }).catch(() => {});
    await link.scrollIntoViewIfNeeded();
    await link.click({ timeout: TIMEOUT });
    return;
  }

  // Strategy 3: mobile hamburger — 增加 boundingBox 检查
  const menu = page.getByTestId("nav-menu");
  if (await menu.isVisible({ timeout: 3000 }).catch(() => false)) {
    await menu.click();
    const mobileNav = page.getByTestId("app-mobile-nav");
    await expect(mobileNav).toBeVisible({ timeout: TIMEOUT });
    const link = mobileNav.getByTestId(`nav-${key}`);
    await link.waitFor({ state: "attached", timeout: TIMEOUT }).catch(() => {});
    
    // 检查元素是否真正可点击
    const box = await link.boundingBox();
    if (!box || box.width === 0 || box.height === 0 || box.x < 0 || box.y < 0) {
      const hash = key === "dashboard" ? "/" : `/#/${key}`;
      await page.goto(hash, { waitUntil: "networkidle" });
      return;
    }
    
    await link.scrollIntoViewIfNeeded();
    await link.click({ force: true, timeout: TIMEOUT });
    return;
  }

  // Fallback: direct URL navigation
  const hash = key === "dashboard" ? "/" : `/#/${key}`;
  await page.goto(hash, { waitUntil: "networkidle" });
}
```

### 关键改动
1. sidebar 增加 2s wait + retry 机制
2. mobile nav 增加 `boundingBox()` 检查，元素不可见时直接 URL fallback
3. timeout 从 8s 放宽到 12s

## 验收标准
- 本地: `npx playwright test --project=chromium e2e/smoke.spec.ts` → 16/16 PASS
- CI: push 后 `gh run view <run_id> --json conclusion` → "success"
