import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { NeonCard } from '../NeonCard';
import { DesignTokens } from '../../../lib/design-tokens';

/**
 * NeonCard 全自动视觉回归测试
 *
 * 如果 AI 在后续迭代中修改了 NeonCard 并引入硬编码，
 * 这些测试将直接崩溃，中断部署流水线。
 */

describe('NeonCard Component Engineering Audit', () => {
  test('应严格对齐系统 DesignTokens 规范，拒绝任何硬编码样式修改', () => {
    const { container } = render(
      <NeonCard title="ION Pool">
        <div>Test Content</div>
      </NeonCard>
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toBeTruthy();

    // 自动化样式契约验证 — 每一项必须精确匹配 DesignTokens
    const style = cardElement.style;
    expect(style.backgroundColor).toBe(DesignTokens.colors.panelBg);
    expect(style.borderRadius).toBe(DesignTokens.spacing.borderRadius);
    expect(style.padding).toBe(DesignTokens.spacing.cardPadding);
    expect(style.borderWidth).toBe(DesignTokens.borders.thin);
    expect(style.borderColor).toBe(DesignTokens.colors.panelBorder);
    expect(style.backdropFilter).toBe(DesignTokens.effects.glassBlur);
  });

  test('cyan variant 应使用 cyan 光效', () => {
    const { container } = render(
      <NeonCard variant="cyan">
        <div>Cyan Card</div>
      </NeonCard>
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement.style.boxShadow).toBe(DesignTokens.effects.neonCyan);
  });

  test('magenta variant 应使用 magenta 光效', () => {
    const { container } = render(
      <NeonCard variant="magenta">
        <div>Magenta Card</div>
      </NeonCard>
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement.style.boxShadow).toBe(DesignTokens.effects.neonMagenta);
  });

  test('无 title 时不应渲染标题元素', () => {
    const { container } = render(
      <NeonCard>
        <div>No Title</div>
      </NeonCard>
    );

    const h2 = container.querySelector('h2');
    expect(h2).toBeNull();
  });

  test('有 title 时应渲染标题并带下划线分隔', () => {
    const { container } = render(
      <NeonCard title="Test Title">
        <div>Content</div>
      </NeonCard>
    );

    const h2 = container.querySelector('h2');
    expect(h2).toBeTruthy();
    expect(h2?.textContent).toBe('Test Title');
    expect(h2?.style.borderBottomWidth).toBe(DesignTokens.borders.thin);
    // 浏览器 DOM 会将 #ffffff 渲染为 rgb(255, 255, 255)，normalize 后对比
    const normalizeColor = (c: string) => c.replace(/\s/g, '');
    expect(normalizeColor(h2?.style.color || '')).toBe('rgb(255,255,255)'); // audit-ignore — test assertion, not UI code
  });

  test('children 内容应正确渲染', () => {
    const { getByText } = render(
      <NeonCard>
        <span>Hello World</span>
      </NeonCard>
    );

    expect(getByText('Hello World')).toBeTruthy();
  });
});
