import React, { useState } from 'react';
import './SlippageControl.css';

/**
 * 高级滑点控制组件
 * - 自动/自定义模式切换
 * - 预设滑点值
 * - 实时验证
 * - 安全警告
 */
export function SlippageControl({
  slippageMode,
  setSlippageMode,
  customSlippage,
  setCustomSlippage,
  suggestedSlippage,
  priceImpact,
  validateSlippage,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(customSlippage.toString());

  const presetValues = [0.5, 1.0, 2.0, 5.0];

  const handlePresetClick = (value) => {
    setSlippageMode('custom');
    setCustomSlippage(value);
    setInputValue(value.toString());
  };

  const handleCustomInput = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSlippageMode('custom');
      setCustomSlippage(numValue);
    }
  };

  const currentSlippage = slippageMode === 'auto' ? suggestedSlippage : customSlippage;
  const validation = validateSlippage(currentSlippage);

  return (
    <div className="slippage-control">
      {/* Toggle Button */}
      <button
        className="slippage-toggle"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="slippage-toggle"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span className="text-sm">Slippage: {currentSlippage.toFixed(1)}%</span>
      </button>

      {/* Dropdown Panel */}
      <div className={`slippage-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="slippage-header">
          <h3 className="text-sm font-semibold">Slippage Settings</h3>
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mode-selector">
          <button
            className={`mode-btn ${slippageMode === 'auto' ? 'active' : ''}`}
            onClick={() => setSlippageMode('auto')}
            data-testid="slippage-auto"
          >
            Auto
            {slippageMode === 'auto' && (
              <span className="text-xs text-cyan-400 ml-1">
                ({suggestedSlippage.toFixed(1)}%)
              </span>
            )}
          </button>
          <button
            className={`mode-btn ${slippageMode === 'custom' ? 'active' : ''}`}
            onClick={() => setSlippageMode('custom')}
            data-testid="slippage-custom"
          >
            Custom
          </button>
        </div>

        {/* Custom Input */}
        {slippageMode === 'custom' && (
          <div className="custom-input-group">
            <input
              type="number"
              value={inputValue}
              onChange={handleCustomInput}
              placeholder="0.5"
              min="0.1"
              max="50"
              step="0.1"
              className="slippage-input"
              data-testid="slippage-input"
            />
            <span className="input-suffix">%</span>
          </div>
        )}

        {/* Preset Buttons */}
        <div className="preset-buttons">
          {presetValues.map((value) => (
            <button
              key={value}
              className={`preset-btn ${customSlippage === value && slippageMode === 'custom' ? 'active' : ''}`}
              onClick={() => handlePresetClick(value)}
              data-testid={`preset-${value}`}
            >
              {value}%
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className="slippage-info">
          {/* Price Impact */}
          <div className="info-row">
            <span className="info-label">Price Impact</span>
            <span
              className={`info-value ${
                priceImpact > 5 ? 'warning' : priceImpact > 2 ? 'medium' : 'safe'
              }`}
            >
              {priceImpact.toFixed(2)}%
            </span>
          </div>

          {/* Suggested Slippage */}
          <div className="info-row">
            <span className="info-label">Suggested Slippage</span>
            <span className="info-value">{suggestedSlippage.toFixed(1)}%</span>
          </div>

          {/* Min Output */}
          <div className="info-row">
            <span className="info-label">Min Output Impact</span>
            <span className="info-value">
              {((currentSlippage / 100) * 100).toFixed(2)}% loss
            </span>
          </div>
        </div>

        {/* Validation Message */}
        <div className={`validation-message ${validation.warning ? 'warning' : ''}`}>
          <span className="text-xs">
            {validation.message}
          </span>
        </div>

        {/* Risk Warning */}
        {currentSlippage > 5 && (
          <div className="risk-warning">
            <span className="warning-icon">⚠️</span>
            <span className="text-xs">
              High slippage may result in significant losses. Proceed with caution.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SlippageControl;
